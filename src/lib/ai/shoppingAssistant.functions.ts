import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AssistantTurnResult } from "@/types/assistant";

/**
 * Server-function wrapper for a shopping assistant turn. Intentionally thin:
 * all runtime logic lives in `./assistantOrchestrator.server` (which picks a
 * backend from environment variables), loaded inside the handler so nothing
 * server-only reaches the client bundle.
 */
const TurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const ContextSchema = z.object({
  faceShape: z
    .enum(["oval", "round", "square", "heart", "diamond", "rectangle"])
    .nullable()
    .default(null),
  recentlyViewedProductIds: z.array(z.string().max(64)).max(12).default([]),
  wishlistProductIds: z.array(z.string().max(64)).max(24).default([]),
  compareProductIds: z.array(z.string().max(64)).max(4).default([]),
  currentProductSlug: z.string().max(120).nullable().default(null),
  maxPriceCents: z.number().int().positive().max(10_000_000).nullable().default(null),
  arTryOnAvailable: z.boolean().default(false),
});

const AssistantInput = z.object({
  messages: z.array(TurnSchema).min(1).max(40),
  context: ContextSchema,
});

export const askShoppingAssistant = createServerFn({ method: "POST" })
  .validator((input: unknown) => AssistantInput.parse(input))
  .handler(async ({ data }): Promise<AssistantTurnResult> => {
    const { runAssistantTurn } = await import("./assistantOrchestrator.server");
    return runAssistantTurn(data.messages, data.context);
  });
