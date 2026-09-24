/**
 * Shopping assistant — Google Gemini backend.
 *
 * Calls the Gemini API's `generateContent` endpoint directly with function
 * declarations for the shared catalog tools. The API key is only ever read
 * server-side via `process.env` and sent as a request header, never to the
 * browser.
 */
import { toProductRef } from "./assistantCatalog.server";
import {
  AssistantError,
  MAX_HISTORY_TURNS,
  MAX_TOOL_ROUNDS,
  SYSTEM_PROMPT,
  TOOLS,
  contextBlock,
  dedupe,
  followUps,
  runTool,
} from "./assistantShared.server";
import type {
  AssistantShopperContext,
  AssistantTurn,
  AssistantTurnResult,
} from "@/types/assistant";
import type { Product } from "@/types/domain";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
export const PROVIDER_ID = "gemini";

const FUNCTION_DECLARATIONS = TOOLS.map((tool) => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
}));

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: { content?: GeminiContent; finishReason?: string }[];
  error?: { message?: string };
}

async function callGemini(
  apiKey: string,
  model: string,
  contents: GeminiContent[],
): Promise<GeminiResponse> {
  const response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
      contents,
    }),
  });

  if (response.status === 429) {
    throw new AssistantError("The assistant is busy right now. Please try again in a moment.", 429);
  }
  if (response.status === 402) {
    throw new AssistantError("AI credits are exhausted. Please add credits to continue.", 402);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new AssistantError(
      `The assistant could not respond (${response.status}): ${detail.slice(0, 200)}`,
      502,
    );
  }
  return (await response.json()) as GeminiResponse;
}

export async function runAssistantTurn(
  messages: AssistantTurn[],
  context: AssistantShopperContext,
): Promise<AssistantTurnResult> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new AssistantError("The assistant is not configured.", 500);
  const model = process.env["GEMINI_MODEL"]?.trim() || DEFAULT_MODEL;

  const history = messages.slice(-MAX_HISTORY_TURNS);
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: contextBlock(context) }] },
    {
      role: "model",
      parts: [{ text: "Understood — I will use the tools before naming any frame." }],
    },
    ...history.map((turn) => ({
      role: (turn.role === "assistant" ? "model" : "user") as GeminiContent["role"],
      parts: [{ text: turn.content }],
    })),
  ];

  const toolsUsed: string[] = [];
  let surfaced: Product[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const payload = await callGemini(apiKey, model, contents);
    const parts = payload.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter(
      (part): part is GeminiPart & { functionCall: NonNullable<GeminiPart["functionCall"]> } =>
        Boolean(part.functionCall),
    );

    if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
      const reply =
        parts
          .map((part) => part.text ?? "")
          .join("\n")
          .trim() ||
        "I could not put an answer together just then. Could you rephrase that for me?";
      const products = dedupe(surfaced).slice(0, 4).map(toProductRef);
      return {
        reply,
        products,
        suggestions: followUps(products),
        toolsUsed: [...new Set(toolsUsed)],
        provider: PROVIDER_ID,
        respondedAt: new Date().toISOString(),
      };
    }

    contents.push({ role: "model", parts: calls });

    const responseParts: GeminiPart[] = [];
    for (const call of calls) {
      const name = call.functionCall.name;
      const args = call.functionCall.args ?? {};
      const outcome = runTool(name, args);
      toolsUsed.push(name);
      if (outcome.products.length > 0) surfaced = outcome.products;

      responseParts.push({
        functionResponse: { name, response: { result: outcome.payload } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  throw new AssistantError("The assistant took too many steps. Please try again.", 504);
}
