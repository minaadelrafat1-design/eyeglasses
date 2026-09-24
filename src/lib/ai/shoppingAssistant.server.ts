/**
 * Shopping assistant — Lovable AI backend.
 *
 * Talks to Lovable AI through the gateway Responses API with the shared
 * catalog tools. The API key, system prompt and tool loop never reach the
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
  parseToolArgs,
  runTool,
} from "./assistantShared.server";
import type {
  AssistantShopperContext,
  AssistantTurn,
  AssistantTurnResult,
} from "@/types/assistant";
import type { Product } from "@/types/domain";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";
export const PROVIDER_ID = "lovable-ai";

const RESPONSES_TOOLS = TOOLS.map((tool) => ({
  type: "function",
  name: tool.name,
  description: tool.description,
  parameters: { ...tool.parameters, additionalProperties: false },
}));

interface ResponsesPayload {
  output_text?: string;
  output?: {
    type?: string;
    name?: string;
    call_id?: string;
    arguments?: string;
    content?: { type?: string; text?: string }[];
  }[];
}

function extractText(payload: ResponsesPayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    if (item.type === "function_call") continue;
    for (const chunk of item.content ?? []) {
      if (typeof chunk.text === "string") parts.push(chunk.text);
    }
  }
  return parts.join("\n").trim();
}

async function callGateway(apiKey: string, input: unknown[]): Promise<ResponsesPayload> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: MODEL, input, tools: RESPONSES_TOOLS, tool_choice: "auto" }),
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
  return (await response.json()) as ResponsesPayload;
}

export async function runAssistantTurn(
  messages: AssistantTurn[],
  context: AssistantShopperContext,
): Promise<AssistantTurnResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AssistantError("The assistant is not configured.", 500);

  const history = messages.slice(-MAX_HISTORY_TURNS);
  const input: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: contextBlock(context) },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
  ];

  const toolsUsed: string[] = [];
  let surfaced: Product[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const payload = await callGateway(apiKey, input);
    const calls = (payload.output ?? []).filter((item) => item.type === "function_call");

    if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
      const reply =
        extractText(payload) ||
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

    for (const call of calls) {
      const name = call.name ?? "";
      const args = parseToolArgs(call.arguments);
      const outcome = runTool(name, args);
      toolsUsed.push(name);
      if (outcome.products.length > 0) surfaced = outcome.products;

      input.push({
        type: "function_call",
        call_id: call.call_id,
        name,
        arguments: call.arguments ?? "{}",
      });
      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(outcome.payload),
      });
    }
  }

  throw new AssistantError("The assistant took too many steps. Please try again.", 504);
}
