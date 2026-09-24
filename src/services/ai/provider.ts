/**
 * AI provider abstraction.
 *
 * The UI never calls a vendor directly — it resolves a provider from this
 * registry. Swapping Lovable AI for another vision API (or plugging in an
 * on-device model) means registering a new provider here; no component or
 * page changes.
 */
import type { FaceAnalysis } from '@/types';

export interface FaceAnalysisProvider {
  readonly id: string;
  readonly label: string;
  /** Analyse a selfie supplied as a data URL. */
  analyze(imageDataUrl: string): Promise<FaceAnalysis>;
}

const registry = new Map<string, FaceAnalysisProvider>();
let activeProviderId: string | null = null;

export function registerFaceAnalysisProvider(
  provider: FaceAnalysisProvider,
  options: { makeActive?: boolean } = {},
): void {
  registry.set(provider.id, provider);
  if (options.makeActive || activeProviderId === null) activeProviderId = provider.id;
}

export function setActiveFaceAnalysisProvider(id: string): void {
  if (!registry.has(id)) throw new Error(`Unknown face analysis provider: ${id}`);
  activeProviderId = id;
}

export function listFaceAnalysisProviders(): FaceAnalysisProvider[] {
  return [...registry.values()];
}

export function getFaceAnalysisProvider(): FaceAnalysisProvider {
  const provider = activeProviderId ? registry.get(activeProviderId) : undefined;
  if (!provider) throw new Error('No face analysis provider registered.');
  return provider;
}