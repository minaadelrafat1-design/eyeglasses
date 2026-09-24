import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { Badge, Button } from '@/components/vui';
import { formatMoney } from '@/lib/utils';
import {
  fetchAdminOrderById,
  updateOrderStatus,
  fetchAdminCustomerById,
  type Order,
} from '@/services/adminService';
import type { OrderStatus, UserProfile } from '@/types';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function AdminOrderDetailPage() {
  return (
    <AdminLayout>
      <OrderDetailContent />
    </AdminLayout>
  );
}

function OrderDetailContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const o = await fetchAdminOrderById(orderId);
      if (!o) {
        setError('Order not found');
        return;
      }
      setOrder(o);
      const c = await fetchAdminCustomerById(o.userId);
      setCustomer(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, status);
      setOrder((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading order…" />;
  if (error && !order) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft size={16} />
          Back to orders
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      {order && (
        <>
          <PageHeader
            title={`Order ${order.id.slice(0, 8)}`}
            description={`Placed on ${new Date(order.createdAt).toLocaleString()}`}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="surface-card overflow-hidden">
                <div className="border-b border-ink-200 px-6 py-4">
                  <h2 className="font-display text-lg font-semibold text-ink-900">Items</h2>
                </div>
                <div className="divide-y divide-ink-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-medium text-ink-800">{item.productName}</p>
                        <p className="text-sm text-ink-500">{item.variantName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-ink-500">{formatMoney(item.unitPriceCents)} × {item.quantity}</p>
                        <p className="font-medium text-ink-800">{formatMoney(item.unitPriceCents * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-ink-200 px-6 py-4">
                  <div className="flex justify-between text-sm text-ink-500">
                    <span>Subtotal</span><span>{formatMoney(order.subtotalCents)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-ink-500">
                    <span>Shipping</span><span>{formatMoney(order.shippingCents)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-ink-500">
                    <span>Tax</span><span>{formatMoney(order.taxCents)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 font-semibold text-ink-900">
                    <span>Total</span><span>{formatMoney(order.totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: status + customer */}
            <div className="space-y-6">
              {/* Status */}
              <div className="surface-card p-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Status</h2>
                <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : order.status === 'pending' ? 'warning' : 'primary'}>
                  {order.status}
                </Badge>
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Update Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    disabled={updating}
                    className="h-11 w-full rounded-lg border border-ink-300 bg-white px-3.5 text-sm text-ink-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer */}
              {customer && (
                <div className="surface-card p-6">
                  <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Customer</h2>
                  <p className="font-medium text-ink-800">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm text-ink-500">{customer.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/admin/customers/${customer.id}`)}
                  >
                    View Customer
                  </Button>
                </div>
              )}

              {/* Shipping address */}
              {order.shippingAddress && (
                <div className="surface-card p-6">
                  <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Shipping Address</h2>
                  <div className="text-sm text-ink-600">
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
