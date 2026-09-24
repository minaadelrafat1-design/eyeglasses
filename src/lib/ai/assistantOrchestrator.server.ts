/**
 * Shopping assistant — backend selection.
 *
 * Three interchangeable backends exist (Lovable AI, OpenRouter, direct
 * Google Gemini); this module picks one at request time purely from
 * environment variables, so switching providers is a config change, never a
 * code change.
 *
 * Priority:
 *   1. `AI_PROVIDER` env var, if set, forces a specific backend
 *      (`lovable` | `openrouter` | `gemini`).
 *   2. Otherwise, the first of these with an API key present wins:
 *      `OPENROUTER_API_KEY` → OpenRouter (can itself route to Gemini models
 *      by model id), `GEMINI_API_KEY` → direct Gemini, `LOVABLE_API_KEY` →
 *      Lovable AI gateway.
 *   3. If none are set, the assistant reports itself as not configured.
 */
import { AssistantError } from "./assistantShared.server";
import type {
  AssistantShopperContext,
  AssistantTurn,
  AssistantTurnResult,
} from "@/types/assistant";

type BackendId = "lovable" | "openrouter" | "gemini";

function resolveBackend(): BackendId {
  const forced = process.env["AI_PROVIDER"]?.trim().toLowerCase();
  if (forced === "lovable" || forced === "openrouter" || forced === "gemini") return forced;

  if (process.env["OPENROUTER_API_KEY"]) return "openrouter";
  if (process.env["GEMINI_API_KEY"]) return "gemini";
  if (process.env["LOVABLE_API_KEY"]) return "lovable";

  throw new AssistantError(
    "The assistant is not configured. Set LOVABLE_API_KEY, OPENROUTER_API_KEY or GEMINI_API_KEY.",
    500,
  );
}

export async function runAssistantTurn(
  messages: AssistantTurn[],
  context: AssistantShopperContext,
): Promise<AssistantTurnResult> {
  const backend = resolveBackend();
  switch (backend) {
    case "openrouter": {
      const { runAssistantTurn: run } = await import("./shoppingAssistantOpenRouter.server");
      return run(messages, context);
    }
    case "gemini": {
      const { runAssistantTurn: run } = await import("./shoppingAssistantGemini.server");
      return run(messages, context);
    }
    case "lovable":
    default: {
      const { runAssistantTurn: run } = await import("./shoppingAssistant.server");
      return run(messages, context);
    }
  }
}
