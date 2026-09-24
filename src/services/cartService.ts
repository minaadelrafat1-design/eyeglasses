import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ApiError } from '@/types';
import type { CartItem } from '@/types';

/**
 * Cart service — syncs the signed-in user's cart to the `cart_items`
 * table. Guests use localStorage (handled by CartProvider); on sign-in
 * the provider calls `mergeGuestCart` to push local items up, then loads
 * the persisted cart.
 */

interface CartRow {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
}

export async function fetchServerCart(userId: string): Promise<CartItem[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, user_id, product_id, variant_id, quantity')
    .eq('user_id', userId);
  if (error) throw new ApiError(error.message, 500, error.code);

  // Enrich with product/variant display info for the UI.
  const rows = (data ?? []) as unknown as CartRow[];
  if (rows.length === 0) return [];

  const variantIds = rows.map((r) => r.variant_id);
  const { data: variants, error: vErr } = await supabase
    .from('product_variants')
    .select('id, product_id, name, price_cents, product:products(id, name, slug, images:product_images(url, alt_text, position))')
    .in('id', variantIds);
  if (vErr) throw new ApiError(vErr.message, 500, vErr.code);

  const variantMap = new Map<string, {
    id: string;
    product_id: string;
    name: string;
    price_cents: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: { url: string; alt_text: string | null; position: number }[];
    } | null;
  }>();
  for (const v of (variants ?? []) as unknown as Array<Record<string, unknown>>) {
    variantMap.set(v.id as string, v as unknown as typeof variantMap extends Map<string, infer T> ? T : never);
  }

  return rows.map((r) => {
    const v = variantMap.get(r.variant_id);
    const images = v?.product?.images ?? [];
    const sorted = [...images].sort((a, b) => a.position - b.position);
    return {
      productId: r.product_id,
      variantId: r.variant_id,
      name: v?.product?.name ? `${v.product.name} — ${v.name}` : v?.name ?? 'Item',
      image: sorted[0]?.url ?? '',
      unitPriceCents: v?.price_cents ?? 0,
      quantity: r.quantity,
    } satisfies CartItem;
  });
}

export async function upsertServerCartItem(
  userId: string,
  item: CartItem,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      {
        user_id: userId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      },
      { onConflict: 'user_id,variant_id' },
    );
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function updateServerCartItemQuantity(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (quantity <= 0) {
    await removeServerCartItem(userId, variantId);
    return;
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('variant_id', variantId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function removeServerCartItem(
  userId: string,
  variantId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('variant_id', variantId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function clearServerCart(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

/**
 * Push guest cart items into the server cart on sign-in, merging
 * quantities for duplicate variants. Returns nothing; the caller
 * reloads the server cart afterwards.
 */
export async function mergeGuestCart(
  userId: string,
  guestItems: CartItem[],
): Promise<void> {
  if (!isSupabaseConfigured || guestItems.length === 0) return;
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      guestItems.map((item) => ({
        user_id: userId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      { onConflict: 'user_id,variant_id' },
    );
  if (error) throw new ApiError(error.message, 500, error.code);
}
