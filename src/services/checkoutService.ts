import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ApiError } from '@/types';
import type { Address, CartItem, Order } from '@/types';
import { fetchOrderById } from './orderService';

/**
 * Checkout service — wraps the server-side `create_order` RPC.
 *
 * The function is SECURITY DEFINER and atomically creates the order,
 inserts
 * order_items, validates stock, decrements inventory, and clears the
 user's
 * cart. No real payment gateway is wired yet — `paymentIntentId` is
 reserved
 * for a future Stripe integration.
 */

interface CreateOrderResult {
  order: Order;
}

export async function createOrder(params: {
  items: CartItem[];
  shippingAddress: Address;
  customerEmail: string;
  shippingCents: number;
  taxCents: number;
}): Promise<Order> {
  if (!isSupabaseConfigured) {
    throw new ApiError('Database is not configured', 503);
  }
  if (params.items.length === 0) {
    throw new ApiError('Your cart is empty', 400);
  }

  const itemsJson = params.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.name.split(' — ')[0] ?? item.name,
    variant_name: item.name.split(' — ')[1] ?? '',
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('create_order', {
    p_items: itemsJson,
    p_shipping_address: params.shippingAddress as unknown as Record<string, string | null>,
    p_customer_email: params.customerEmail,
    p_shipping_cents: params.shippingCents,
    p_tax_cents: params.taxCents,
  });

  if (error) {
    throw new ApiError(error.message, 500, error.code);
  }

  const orderId = (data as unknown as { id: string }).id;
  const order = await fetchOrderById(orderId);
  if (!order) {
    throw new ApiError('Order was created but could not be retrieved', 500);
  }
  return order;
}

/**
 * Calculate shipping cost. Free over $150, otherwise $7.95.
 * In production this would call a carrier API; for now it's a simple rule.
 */
export function calculateShipping(subtotalCents: number): number {
  if (subtotalCents === 0) return 0;
  if (subtotalCents >= 15000) return 0;
  return 795;
}

/**
 * Calculate tax. Flat 8% for demo purposes.
 * In production this would use a tax service based on shipping address.
 */
export function calculateTax(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.08);
}
