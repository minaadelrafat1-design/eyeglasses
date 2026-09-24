import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ApiError } from '@/types';
import type { Order, OrderStatus, OrderItem } from '@/types';

/**
 * Order service — reads order history for the signed-in user.
 * Writes (checkout) are handled server-side via an edge function
 * (not implemented yet).
 */

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  shipping_address: unknown;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    order_id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    variant_name: string;
    unit_price_cents: number;
    quantity: number;
    created_at: string;
  }[];
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as OrderStatus,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    shippingAddress: (row.shipping_address as Order['shippingAddress']) ?? null,
    items: (row.order_items ?? []).map((oi): OrderItem => ({
      id: oi.id,
      orderId: oi.order_id,
      productId: oi.product_id,
      variantId: oi.variant_id,
      productName: oi.product_name,
      variantName: oi.variant_name,
      unitPriceCents: oi.unit_price_cents,
      quantity: oi.quantity,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((row) => mapOrder(row as unknown as OrderRow));
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;
  return mapOrder(data as unknown as OrderRow);
}

export function orderStatusToLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    fulfilled: 'Fulfilled',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status];
}
