/**
 * Shopping assistant provider abstraction.
 *
 * The UI never calls a vendor directly — it resolves a provider from this
 * registry. Swapping Lovable AI for another conversational backend means
 * registering a new provider here; no component or page changes.
 */
import type { AssistantTurnRequest, AssistantTurnResult } from '@/types/assistant';

export interface ShoppingAssistantProvider {
  readonly id: string;
  readonly label: string;
  respond(request: AssistantTurnRequest): Promise<AssistantTurnResult>;
}

const registry = new Map<string, ShoppingAssistantProvider>();
let activeProviderId: string | null = null;

export function registerShoppingAssistantProvider(
  provider: ShoppingAssistantProvider,
  options: { makeActive?: boolean } = {},
): void {
  registry.set(provider.id, provider);
  if (options.makeActive || activeProviderId === null) activeProviderId = provider.id;
}

export function setActiveShoppingAssistantProvider(id: string): void {
  if (!registry.has(id)) throw new Error(`Unknown shopping assistant provider: ${id}`);
  activeProviderId = id;
}

export function listShoppingAssistantProviders(): ShoppingAssistantProvider[] {
  return [...registry.values()];
}

export function getShoppingAssistantProvider(): ShoppingAssistantProvider {
  const provider = activeProviderId ? registry.get(activeProviderId) : undefined;
  if (!provider) throw new Error('No shopping assistant provider registered.');
  return provider;
}
