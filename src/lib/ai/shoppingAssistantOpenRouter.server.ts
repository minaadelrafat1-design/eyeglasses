/**
 * Shopping assistant — OpenRouter backend.
 *
 * OpenRouter exposes an OpenAI-compatible Chat Completions API and can route
 * to many underlying models — including Google Gemini models — by model id
 * alone, so this one integration covers both "OpenRouter" and "Gemini via
 * OpenRouter". The API key never reaches the browser.
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

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";
export const PROVIDER_ID = "openrouter";

const CHAT_TOOLS = TOOLS.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
    };
  }[];
  error?: { message?: string };
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<ChatCompletionResponse> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Optional but recommended by OpenRouter for attribution/rate-limit tiers.
      "HTTP-Referer": "https://vuera.example",
      "X-Title": "Vuera Shopping Assistant",
    },
    body: JSON.stringify({ model, messages, tools: CHAT_TOOLS, tool_choice: "auto" }),
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
  return (await response.json()) as ChatCompletionResponse;
}

export async function runAssistantTurn(
  messages: AssistantTurn[],
  context: AssistantShopperContext,
): Promise<AssistantTurnResult> {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) throw new AssistantError("The assistant is not configured.", 500);
  const model = process.env["OPENROUTER_MODEL"]?.trim() || DEFAULT_MODEL;

  const history = messages.slice(-MAX_HISTORY_TURNS);
  const chat: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: contextBlock(context) },
    ...history.map((turn) => ({
      role: (turn.role === "assistant" ? "assistant" : "user") as ChatMessage["role"],
      content: turn.content,
    })),
  ];

  const toolsUsed: string[] = [];
  let surfaced: Product[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const payload = await callOpenRouter(apiKey, model, chat);
    const message = payload.choices?.[0]?.message;
    const calls = message?.tool_calls ?? [];

    if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
      const reply =
        message?.content?.trim() ||
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

    chat.push({
      role: "assistant",
      content: message?.content ?? null,
      tool_calls: calls as ChatMessage["tool_calls"],
    });

    for (const call of calls) {
      const name = call.function.name;
      const args = parseToolArgs(call.function.arguments);
      const outcome = runTool(name, args);
      toolsUsed.push(name);
      if (outcome.products.length > 0) surfaced = outcome.products;

      chat.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(outcome.payload) });
    }
  }

  throw new AssistantError("The assistant took too many steps. Please try again.", 504);
}
