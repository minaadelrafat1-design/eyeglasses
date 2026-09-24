/**
 * Lovable AI try-on provider. Delegates to the server function so the API key
 * and storage writes stay server-side.
 */
import { generateTryOn } from '@/lib/ai/tryOn.functions';
import type { TryOnGenerationInput } from '@/types';
import type { TryOnProvider, TryOnRenderOutput } from './tryOnProvider';

export const lovableTryOnProvider: TryOnProvider = {
  id: 'lovable-ai',
  label: 'Lovable AI image try-on',
  kind: 'generated-image',
  async generate(input: TryOnGenerationInput): Promise<TryOnRenderOutput> {
    const result = await generateTryOn({ data: input });
    return { generation: result.generation, resultImageUrl: result.resultDataUrl };
  },
};
