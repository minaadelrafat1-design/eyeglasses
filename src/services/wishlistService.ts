import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ApiError } from '@/types';

/**
 * Wishlist service — syncs the signed-in user's wishlist to the
 * `wishlist_items` table. Guests use localStorage; on sign-in the
 * provider merges local product IDs up, then loads the persisted set.
 */

export async function fetchServerWishlist(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId);
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((r) => (r as unknown as { product_id: string }).product_id);
}

export async function addServerWishlistItem(
  userId: string,
  productId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('wishlist_items')
    .upsert(
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id' },
    );
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function removeServerWishlistItem(
  userId: string,
  productId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function mergeGuestWishlist(
  userId: string,
  productIds: string[],
): Promise<void> {
  if (!isSupabaseConfigured || productIds.length === 0) return;
  const { error } = await supabase
    .from('wishlist_items')
    .upsert(
      productIds.map((pid) => ({ user_id: userId, product_id: pid })),
      { onConflict: 'user_id,product_id' },
    );
  if (error) throw new ApiError(error.message, 500, error.code);
}
