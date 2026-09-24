/**
 * AI try-on provider abstraction.
 *
 * Mirrors the face-analysis registry: the UI resolves a provider instead of
 * calling a vendor. A future AR renderer or a different image model only has
 * to implement this interface and register itself.
 */
import type { TryOnGeneration, TryOnGenerationInput } from '@/types';

export interface TryOnRenderOutput {
  generation: TryOnGeneration;
  /** Immediately displayable image (data URL or signed URL). */
  resultImageUrl: string;
}

export interface TryOnProvider {
  readonly id: string;
  readonly label: string;
  /** True when the provider composites a still image (vs. live AR). */
  readonly kind: 'generated-image' | 'ar';
  generate(input: TryOnGenerationInput): Promise<TryOnRenderOutput>;
}

const registry = new Map<string, TryOnProvider>();
let activeProviderId: string | null = null;

export function registerTryOnProvider(
  provider: TryOnProvider,
  options: { makeActive?: boolean } = {},
): void {
  registry.set(provider.id, provider);
  if (options.makeActive || activeProviderId === null) activeProviderId = provider.id;
}

export function setActiveTryOnProvider(id: string): void {
  if (!registry.has(id)) throw new Error(`Unknown try-on provider: ${id}`);
  activeProviderId = id;
}

export function listTryOnProviders(): TryOnProvider[] {
  return [...registry.values()];
}

export function getTryOnProvider(): TryOnProvider {
  const provider = activeProviderId ? registry.get(activeProviderId) : undefined;
  if (!provider) throw new Error('No try-on provider registered.');
  return provider;
}
