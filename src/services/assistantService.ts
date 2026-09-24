/**
 * Shopping assistant service.
 *
 * Orchestration layer between the chat UI and whichever assistant provider is
 * active. Responsibilities kept here, out of components:
 *   - build the anonymous shopping context,
 *   - strip anything that looks like personal data before it leaves the browser,
 *   - trim history to a sane window,
 *   - translate provider failures into customer-facing messages.
 */
// Registry module keeps the assistant free of backend-only imports.
import { getShoppingAssistantProvider } from './ai/assistantRegistry';

import { ApiError } from '@/types';
import type {
  AssistantMessage,
  AssistantShopperContext,
  AssistantTurn,
  AssistantTurnResult,
} from '@/types/assistant';

const MAX_HISTORY_TURNS = 16;
const MAX_MESSAGE_LENGTH = 1000;

/**
 * Redaction guard. Customers sometimes paste an email, phone number or card
 * digits into chat; none of that is needed to recommend frames, so it is
 * replaced before the message leaves the browser.
 */
const REDACTIONS: { pattern: RegExp; label: string }[] = [
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]{2,}/g, label: '[email removed]' },
  { pattern: /\b(?:\d[ -]?){13,19}\b/g, label: '[card number removed]' },
  { pattern: /\+?\d[\d\s().-]{7,}\d/g, label: '[phone removed]' },
];

export function redactPersonalData(text: string): string {
  return REDACTIONS.reduce(
    (value, rule) => value.replace(rule.pattern, rule.label),
    text,
  ).trim();
}

export function sanitizeMessage(text: string): string {
  return redactPersonalData(text).slice(0, MAX_MESSAGE_LENGTH);
}

/** Convert stored UI messages into the text-only turns the provider receives. */
export function toTurns(messages: AssistantMessage[]): AssistantTurn[] {
  return messages
    .filter((message) => !message.pending && !message.failed && message.content.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS)
    .map((message) => ({ role: message.role, content: sanitizeMessage(message.content) }));
}

export async function sendAssistantTurn(
  messages: AssistantMessage[],
  context: AssistantShopperContext,
): Promise<AssistantTurnResult> {
  const turns = toTurns(messages);
  if (turns.length === 0) {
    throw new ApiError('Nothing to send to the assistant.', 400, 'EMPTY_CONVERSATION');
  }

  try {
    return await getShoppingAssistantProvider().respond({ messages: turns, context });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'The assistant is unavailable right now.';
    throw new ApiError(message, 502, 'ASSISTANT_FAILED');
  }
}
