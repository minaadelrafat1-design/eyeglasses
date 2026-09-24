import type {
  RecommendationRequest,
  RecommendationResult,
  VirtualTryOnRequest,
  VirtualTryOnResult,
} from '@/types';
import { featureFlags } from '@/lib/featureFlags';
import { ApiError } from '@/types';

/**
 * AI service — thin client for the future AI feature pipelines.
 *
 * Each feature is backed by a Supabase edge function. The functions are not
 * deployed yet; calls throw a clear "not available" error until the feature
 * flag is enabled and the function ships. This keeps the call sites stable
 * so enabling a feature later requires no UI changes.
 */

const TRYON_FUNCTION = 'virtual-tryon';
const RECOMMEND_FUNCTION = 'recommend-glasses';

function assertEnabled(flag: boolean, feature: string): void {
  if (!flag) {
    throw new ApiError(
      `${feature} is not available yet. Check back soon.`,
      503,
      'FEATURE_DISABLED',
    );
  }
}

export async function requestVirtualTryOn(
  req: VirtualTryOnRequest,
): Promise<VirtualTryOnResult> {
  assertEnabled(featureFlags.virtualTryOn, 'Virtual try-on');

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke(TRYON_FUNCTION, {
    body: req,
  });

  if (error) throw new ApiError(error.message, 502, 'TRYON_FAILED');
  return data as VirtualTryOnResult;
}

export async function requestRecommendations(
  req: RecommendationRequest,
): Promise<RecommendationResult[]> {
  assertEnabled(featureFlags.recommendationAssistant, 'Recommendation assistant');

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke(RECOMMEND_FUNCTION, {
    body: req,
  });

  if (error) throw new ApiError(error.message, 502, 'RECOMMEND_FAILED');
  return data as RecommendationResult[];
}
