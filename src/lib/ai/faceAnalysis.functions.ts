import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { FaceAnalysis } from '@/types';

/**
 * Server-function wrapper for selfie analysis. Intentionally thin: all runtime
 * logic lives in `./faceAnalysis.server`, loaded inside the handler.
 */
const AnalyzeInput = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .max(8_000_000)
    .refine((value) => value.startsWith('data:image/'), 'Expected an image data URL'),
});

export const analyzeFaceShape = createServerFn({ method: 'POST' })
  .validator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<FaceAnalysis> => {
    const { analyzeSelfie } = await import('./faceAnalysis.server');
    return analyzeSelfie(data.imageDataUrl);
  });