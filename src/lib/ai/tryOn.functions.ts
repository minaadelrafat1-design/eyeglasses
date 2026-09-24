import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import type { RunTryOnResult } from './tryOn.server';

/**
 * Thin server-function wrapper for AI try-on generation. All runtime logic is
 * loaded inside the handler so nothing server-only reaches the client bundle.
 */
const TryOnInput = z.object({
  productId: z.string().min(1).max(200),
  productSlug: z.string().max(200).nullable().default(null),
  productName: z.string().min(1).max(200),
  brandName: z.string().max(200).nullable().default(null),
  productImageUrl: z.string().url().max(2000).nullable().default(null),
  variantId: z.string().max(200).nullable().default(null),
  variantLabel: z.string().max(200).nullable().default(null),
  selfieDataUrl: z
    .string()
    .min(32)
    .max(8_000_000)
    .refine((value) => value.startsWith('data:image/'), 'Expected an image data URL'),
});

export const generateTryOn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => TryOnInput.parse(input))
  .handler(async ({ data, context }): Promise<RunTryOnResult> => {
    const { runTryOn } = await import('./tryOn.server');
    return runTryOn(context.supabase, context.userId, data);
  });
