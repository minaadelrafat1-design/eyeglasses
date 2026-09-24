import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/navigation';
import { Search, ChevronRight } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { DataTable } from '@/components/admin/DataTable';
import { Badge, Input, Modal, Button } from '@/components/vui';
import { formatMoney } from '@/lib/utils';
import {
  fetchAdminOrders,
  updateOrderStatus,
  type Order,
} from '@/services/adminService';
import type { OrderStatus } from '@/types';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function AdminOrdersPage() {
  return (
    <AdminLayout>
      <OrdersContent />
    </AdminLayout>
  );
}

function OrdersContent() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o)));
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading orders…" />;
  if (error && orders.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Orders"
        description="View and manage all customer orders."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search by order ID or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-lg border border-ink-300 bg-white px-3.5 text-sm text-ink-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      <DataTable
        columns={[
          {
            key: 'id',
            header: 'Order',
            render: (o: Order) => (
              <div>
                <p className="font-mono text-xs text-ink-500">{o.id.slice(0, 8)}</p>
                <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
            ),
          },
          {
            key: 'items',
            header: 'Items',
            render: (o: Order) => (
              <div>
                {o.items.slice(0, 2).map((item) => (
                  <p key={item.id} className="text-sm text-ink-700">{item.productName} ×{item.quantity}</p>
                ))}
                {o.items.length > 2 && <p className="text-xs text-ink-400">+{o.items.length - 2} more</p>}
              </div>
            ),
          },
          { key: 'total', header: 'Total', render: (o: Order) => <span className="font-medium">{formatMoney(o.totalCents)}</span> },
          {
            key: 'status',
            header: 'Status',
            render: (o: Order) => (
              <button onClick={(e) => { e.stopPropagation(); openStatusModal(o); }}>
                <StatusBadge status={o.status} />
              </button>
            ),
          },
          {
            key: 'action',
            header: '',
            render: () => <ChevronRight size={16} className="text-ink-400" />,
            className: 'text-right',
          },
        ]}
        data={filtered}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        emptyMessage="No orders found"
      />

      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Update Order Status"
      >
        <p className="text-sm text-ink-600">
          Order <span className="font-mono text-xs">{selectedOrder?.id.slice(0, 8)}</span> — {formatMoney(selectedOrder?.totalCents ?? 0)}
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            className="h-11 w-full rounded-lg border border-ink-300 bg-white px-3.5 text-sm text-ink-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
          <Button isLoading={updating} onClick={handleUpdateStatus}>Update Status</Button>
        </div>
      </Modal>
    </>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === 'pending' ? 'warning' : status === 'delivered' ? 'success' : status === 'cancelled' || status === 'refunded' ? 'error' : 'primary';
  return <Badge variant={variant}>{status}</Badge>;
}
