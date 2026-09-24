import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from '@/lib/navigation';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { Button, Spinner, Badge } from '@/components/vui';
import { fetchOrderById, orderStatusToLabel } from '@/services/orderService';
import { formatMoney } from '@/lib/utils';
import type { Order } from '@/types';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const justPlaced = (location.state as { justPlaced?: boolean } | null)?.justPlaced ?? false;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setLoading(true);
    fetchOrderById(orderId)
      .then((o) => { if (active) setOrder(o); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Failed to load order'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-lg font-semibold text-ink-900">Order not found</p>
        <p className="mt-1 text-ink-500">{error ?? 'We could not find this order.'}</p>
        <Link to="/account" className="mt-4 inline-block">
          <Button variant="outline">View your orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {justPlaced && (
        <div className="border-b border-success-200 bg-success-50">
          <div className="container-app py-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-success-600" />
              <div>
                <p className="font-semibold text-success-800">Order placed successfully!</p>
                <p className="text-sm text-success-700">
                  We've sent a confirmation to your email. Your order is now being processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="mt-1 text-ink-500">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <Badge variant="neutral" className="text-sm">
              {orderStatusToLabel(order.status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Package size={20} />
                Items
              </h2>
              <div className="mt-4 divide-y divide-ink-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-ink-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-ink-500">{item.variantName}</p>
                      )}
                      <p className="mt-1 text-sm text-ink-500">Qty {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-ink-900">
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {order.shippingAddress && (
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <h2 className="text-lg font-semibold">Shipping address</h2>
                <div className="mt-3 text-sm text-ink-700">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Payment summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Subtotal</span>
                  <span className="font-medium text-ink-900">{formatMoney(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Shipping</span>
                  <span className="font-medium text-ink-900">
                    {order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Tax</span>
                  <span className="font-medium text-ink-900">{formatMoney(order.taxCents)}</span>
                </div>
                <div className="border-t border-ink-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-ink-900">Total</span>
                    <span className="text-xl font-semibold text-ink-900">
                      {formatMoney(order.totalCents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/shop">
                <Button fullWidth size="lg">
                  Continue shopping
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="outline" fullWidth size="lg">
                  <Home size={18} />
                  Back to account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
