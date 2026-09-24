/**
 * Server-only AI try-on image generation.
 *
 * ============================================================================
 *  THIS is the function to replace when connecting a different (or your own)
 *  AI image-generation provider: `renderTryOn()` below. It currently talks to
 *  Lovable AI's image endpoint. To swap providers, keep the exact same
 *  `TryOnRenderRequest` → `TryOnRenderResult` contract (used by
 *  `tryOn.server.ts` and, transitively, the whole try-on UI) and change only
 *  the HTTP call and response parsing inside `renderTryOn()` — nothing else
 *  in the app needs to know which vendor is behind it.
 *
 *  Credentials: read from `process.env` only (never hardcoded, never sent to
 *  the browser — this file is imported exclusively from other `*.server.ts`
 *  modules). If the required key is missing, `renderTryOn()` throws
 *  `TryOnGenerationError` rather than returning a placeholder image, so the
 *  UI always reflects a real failure instead of a fake success.
 * ============================================================================
 */
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const MODEL = "google/gemini-3-pro-image";
export const TRY_ON_PROVIDER_ID = "lovable-ai";

export class TryOnGenerationError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "TryOnGenerationError";
    this.status = status;
  }
}

export interface TryOnRenderRequest {
  selfieDataUrl: string;
  productImageUrl: string | null;
  productName: string;
  brandName: string | null;
  variantLabel: string | null;
}

export interface TryOnRenderResult {
  /** Raw base64 PNG payload (no data URL prefix). */
  base64: string;
  provider: string;
}

function buildPrompt(request: TryOnRenderRequest): string {
  const frame = [request.brandName, request.productName].filter(Boolean).join(" ");
  const colour = request.variantLabel ? ` in the ${request.variantLabel} colourway` : "";
  return [
    `Edit the first photo (the person) so they are wearing the eyewear shown in the second photo: the ${frame}${colour}.`,
    "Keep the person’s face, skin tone, hairstyle, expression, pose, lighting and background exactly as they are.",
    "Place the frames realistically on the nose bridge, aligned with the eyes and ears, sized correctly for the face.",
    "Match the frame shape, colour and material from the product photo. Add natural shadows and subtle lens reflections.",
    "Return a single photorealistic image of the person wearing the glasses. Do not add text, watermarks or borders.",
  ].join(" ");
}

function extractBase64(payload: unknown): string | null {
  const body = payload as {
    data?: { b64_json?: string; url?: string }[];
    choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
  };
  const direct = body.data?.[0]?.b64_json;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const chatImage = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof chatImage === "string" && chatImage.startsWith("data:")) {
    const comma = chatImage.indexOf(",");
    if (comma > -1) return chatImage.slice(comma + 1);
  }
  return null;
}

// ============ CONNECT YOUR AI IMAGE PROVIDER HERE ============
// Replace the body of this function to call a different image-generation
// API. Keep the signature (`TryOnRenderRequest` in, `TryOnRenderResult` out)
// so nothing upstream (tryOn.server.ts, tryOnService.ts, the try-on UI) has
// to change.
export async function renderTryOn(request: TryOnRenderRequest): Promise<TryOnRenderResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new TryOnGenerationError("AI try-on is not configured.", 500);

  const content: Record<string, unknown>[] = [
    { type: "text", text: buildPrompt(request) },
    { type: "image_url", image_url: { url: request.selfieDataUrl } },
  ];
  if (request.productImageUrl) {
    content.push({ type: "image_url", image_url: { url: request.productImageUrl } });
  }

  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });
  } catch {
    throw new TryOnGenerationError("Could not reach the image generator. Please try again.", 503);
  }

  if (response.status === 429) {
    throw new TryOnGenerationError(
      "Too many try-ons right now. Please try again in a moment.",
      429,
    );
  }
  if (response.status === 402) {
    throw new TryOnGenerationError(
      "AI credits are exhausted. Add credits to keep generating.",
      402,
    );
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new TryOnGenerationError(
      `The try-on generator failed (${response.status}). ${detail.slice(0, 160)}`.trim(),
      502,
    );
  }

  const base64 = extractBase64(await response.json());
  if (!base64) {
    throw new TryOnGenerationError(
      "The generator did not return an image. Try a clearer, front-facing photo.",
      502,
    );
  }

  return { base64, provider: TRY_ON_PROVIDER_ID };
}
