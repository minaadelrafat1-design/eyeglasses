/**
 * Try-on service layer.
 *
 * The UI only talks to this module: it resolves the active AI provider for
 * generation and reads/deletes history through the database with row-level
 * security scoping everything to the signed-in customer.
 */
import { supabase } from '@/lib/supabase';
import { getTryOnProvider } from '@/services/ai';
import type {
  Product,
  ProductVariant,
  TryOnGeneration,
  TryOnGenerationInput,
  TryOnGenerationView,
} from '@/types';

const BUCKET = 'try-on-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Build a generation request from a catalog product. */
export function buildTryOnInput(
  product: Product,
  selfieDataUrl: string,
  variant?: ProductVariant | null,
): TryOnGenerationInput {
  return {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    brandName: product.brandName,
    productImageUrl: product.images[0]?.url ?? null,
    variantId: variant?.id ?? null,
    variantLabel: variant?.name ?? null,
    selfieDataUrl,
  };
}

export async function generateTryOnImage(
  input: TryOnGenerationInput,
): Promise<TryOnGenerationView> {
  const provider = getTryOnProvider();
  const { generation, resultImageUrl } = await provider.generate(input);
  return { ...generation, resultImageUrl, sourceImageUrl: input.selfieDataUrl };
}

async function signPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

interface HistoryRow {
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

function mapRow(row: HistoryRow): TryOnGeneration {
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
    status: row.status === 'succeeded' || row.status === 'failed' ? row.status : 'pending',
    provider: row.provider,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

/** Most recent successful try-ons for the signed-in customer, with signed URLs. */
export async function fetchTryOnHistory(limit = 24): Promise<TryOnGenerationView[]> {
  const { data, error } = await supabase
    .from('tryon_generations')
    .select('*')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return Promise.all(
    (data as HistoryRow[]).map(async (row) => {
      const generation = mapRow(row);
      const [resultImageUrl, sourceImageUrl] = await Promise.all([
        signPath(generation.resultImagePath),
        signPath(generation.sourceImagePath),
      ]);
      return { ...generation, resultImageUrl, sourceImageUrl };
    }),
  );
}

export async function deleteTryOnGeneration(generation: TryOnGeneration): Promise<void> {
  const paths = [generation.sourceImagePath, generation.resultImagePath].filter(
    (path): path is string => Boolean(path),
  );
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
  await supabase.from('tryon_generations').delete().eq('id', generation.id);
}
