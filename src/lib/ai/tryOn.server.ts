/**
 * Server-only orchestration for an AI try-on: persist the attempt, render the
 * image, store both photos in the private bucket, and record the outcome.
 * Generation itself lives in `tryOnImage.server`; this module only wires it to
 * the database and storage.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TryOnGeneration, TryOnGenerationInput } from '@/types';
import { renderTryOn, TryOnGenerationError, TRY_ON_PROVIDER_ID } from './tryOnImage.server';

const BUCKET = 'try-on-images';

interface TryOnRow {
  id: string;
  product_id: string;
  product_slug: string | null;
  product_name: string;
  brand_name: string | null;
  product_image_url: string | null;
  variant_id: string | null;
  variant_label: string | null;
  source_image_path: string | null;
  result_image_path: string | null;
  status: string;
  provider: string;
  error_message: string | null;
  created_at: string;
}

export function mapTryOnRow(row: TryOnRow): TryOnGeneration {
  return {
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    brandName: row.brand_name,
    productImageUrl: row.product_image_url,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    sourceImagePath: row.source_image_path,
    resultImagePath: row.result_image_path,
    status: (row.status === 'succeeded' || row.status === 'failed' ? row.status : 'pending'),
    provider: row.provider,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) throw new TryOnGenerationError('The uploaded photo could not be read.', 400);
  return { contentType: match[1]!, bytes: decodeBase64(match[2]!) };
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface RunTryOnResult {
  generation: TryOnGeneration;
  /** Inline result so the UI can render instantly without a signed URL round-trip. */
  resultDataUrl: string;
}

export async function runTryOn(
  supabase: SupabaseClient,
  userId: string,
  input: TryOnGenerationInput,
): Promise<RunTryOnResult> {
  const inserted = await supabase
    .from('tryon_generations')
    .insert({
      user_id: userId,
      product_id: input.productId,
      product_slug: input.productSlug,
      product_name: input.productName,
      brand_name: input.brandName,
      product_image_url: input.productImageUrl,
      variant_id: input.variantId,
      variant_label: input.variantLabel,
      status: 'pending',
      provider: TRY_ON_PROVIDER_ID,
    })
    .select('*')
    .single();

  if (inserted.error || !inserted.data) {
    throw new TryOnGenerationError('Could not start the try-on. Please try again.', 500);
  }

  const row = inserted.data as TryOnRow;
  const folder = `${userId}/${row.id}`;

  const fail = async (message: string) => {
    await supabase
      .from('tryon_generations')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('id', row.id);
  };

  try {
    const source = decodeDataUrl(input.selfieDataUrl);
    const sourcePath = `${folder}/source.jpg`;
    const sourceUpload = await supabase.storage
      .from(BUCKET)
      .upload(sourcePath, source.bytes, { contentType: source.contentType, upsert: true });
    if (sourceUpload.error) {
      throw new TryOnGenerationError('Could not save your photo. Please try again.', 500);
    }

    const rendered = await renderTryOn({
      selfieDataUrl: input.selfieDataUrl,
      productImageUrl: input.productImageUrl,
      productName: input.productName,
      brandName: input.brandName,
      variantLabel: input.variantLabel,
    });

    const resultPath = `${folder}/result.png`;
    const resultUpload = await supabase.storage
      .from(BUCKET)
      .upload(resultPath, decodeBase64(rendered.base64), {
        contentType: 'image/png',
        upsert: true,
      });
    if (resultUpload.error) {
      throw new TryOnGenerationError('Could not save the generated image.', 500);
    }

    const updated = await supabase
      .from('tryon_generations')
      .update({
        status: 'succeeded',
        source_image_path: sourcePath,
        result_image_path: resultPath,
        provider: rendered.provider,
        error_message: null,
      })
      .eq('id', row.id)
      .select('*')
      .single();

    const finalRow = (updated.data as TryOnRow | null) ?? {
      ...row,
      status: 'succeeded',
      source_image_path: sourcePath,
      result_image_path: resultPath,
    };

    return {
      generation: mapTryOnRow(finalRow),
      resultDataUrl: `data:image/png;base64,${rendered.base64}`,
    };
  } catch (error) {
    const message =
      error instanceof TryOnGenerationError
        ? error.message
        : 'The try-on could not be generated. Please try again.';
    await fail(message);
    throw error instanceof TryOnGenerationError
      ? error
      : new TryOnGenerationError(message, 500);
  }
}
