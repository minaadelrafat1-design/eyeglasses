/**
 * Server-only face analysis implementation.
 *
 * Talks to Lovable AI through the gateway Responses API. Kept apart from the
 * server-function wrapper so the wrapper module stays free of runtime code and
 * so a different vision backend can be swapped in here without touching the
 * UI or the service layer.
 */
import { FACE_SHAPES, type FaceAnalysis, type FaceShape } from '@/types';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/responses';
const MODEL = 'openai/gpt-5.6-sol';
export const PROVIDER_ID = 'lovable-ai';

const INSTRUCTION = [
  'You are a professional optician analysing a customer selfie to determine face shape.',
  'Classify the face into exactly one of: oval, round, square, heart, diamond, rectangle.',
  'Base the judgement on face length vs width, jawline angularity, cheekbone width and forehead width.',
  'Respond with JSON only, no markdown, using this exact shape:',
  '{"faceShape":"oval","confidence":0.0,"candidates":[{"shape":"oval","confidence":0.0}],',
  '"summary":"one short sentence about the facial proportions",',
  '"landmarks":{"faceWidthRatio":0.0,"faceLengthRatio":0.0,"jawWidthRatio":0.0,"foreheadWidthRatio":0.0}}',
  'All confidence values are between 0 and 1. Ratios are normalised 0–1 or null when unclear.',
  'If no human face is visible, set faceShape to "oval", confidence to 0 and say so in summary.',
].join(' ');

export class FaceAnalysisError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'FaceAnalysisError';
    this.status = status;
  }
}

function clamp01(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function toFaceShape(value: unknown): FaceShape | null {
  const slug = String(value ?? '').toLowerCase().trim();
  return (FACE_SHAPES as string[]).includes(slug) ? (slug as FaceShape) : null;
}

function ratioOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
}

/** Pull the assistant text out of a Responses API payload. */
function extractText(payload: unknown): string {
  const response = payload as {
    output_text?: string;
    output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    for (const chunk of item.content ?? []) {
      if (typeof chunk.text === 'string') parts.push(chunk.text);
    }
  }
  return parts.join('\n');
}

function parseAnalysis(text: string): FaceAnalysis {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new FaceAnalysisError('The analyzer returned an unreadable result.', 502);

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    throw new FaceAnalysisError('The analyzer returned malformed JSON.', 502);
  }

  const primary = toFaceShape(raw['faceShape']);
  if (!primary) throw new FaceAnalysisError('No recognisable face shape was detected.', 422);

  const candidateList = Array.isArray(raw['candidates']) ? raw['candidates'] : [];
  const candidates = candidateList
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const shape = toFaceShape(item['shape']);
      return shape ? { shape, confidence: clamp01(item['confidence']) } : null;
    })
    .filter((entry): entry is { shape: FaceShape; confidence: number } => entry !== null)
    .sort((a, b) => b.confidence - a.confidence);

  const confidence = clamp01(raw['confidence']);
  if (!candidates.some((c) => c.shape === primary)) {
    candidates.unshift({ shape: primary, confidence });
  }

  const landmarksRaw = raw['landmarks'] as Record<string, unknown> | null | undefined;

  return {
    faceShape: primary,
    confidence,
    candidates: candidates.slice(0, 4),
    summary: typeof raw['summary'] === 'string' ? raw['summary'] : '',
    landmarks: landmarksRaw
      ? {
          faceWidthRatio: ratioOrNull(landmarksRaw['faceWidthRatio']),
          faceLengthRatio: ratioOrNull(landmarksRaw['faceLengthRatio']),
          jawWidthRatio: ratioOrNull(landmarksRaw['jawWidthRatio']),
          foreheadWidthRatio: ratioOrNull(landmarksRaw['foreheadWidthRatio']),
        }
      : null,
    provider: PROVIDER_ID,
    analyzedAt: new Date().toISOString(),
  };
}

export async function analyzeSelfie(imageDataUrl: string): Promise<FaceAnalysis> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new FaceAnalysisError('Face analysis is not configured.', 500);

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: INSTRUCTION },
            { type: 'input_image', image_url: imageDataUrl },
          ],
        },
      ],
    }),
  });

  if (response.status === 429) {
    throw new FaceAnalysisError('Too many analyses right now. Please try again shortly.', 429);
  }
  if (response.status === 402) {
    throw new FaceAnalysisError('AI credits are exhausted. Please add credits to continue.', 402);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new FaceAnalysisError(
      `Face analysis failed (${response.status}): ${detail.slice(0, 200)}`,
      502,
    );
  }

  return parseAnalysis(extractText(await response.json()));
}