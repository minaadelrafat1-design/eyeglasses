import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@/lib/navigation';
import { ArrowLeft, Mail, Calendar, ShoppingBag, Star, Heart, Settings } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState, StatCard } from '@/components/admin';
import { DataTable } from '@/components/admin/DataTable';
import { Badge, Button, Modal } from '@/components/vui';
import { formatMoney } from '@/lib/utils';
import {
  fetchAdminCustomerById,
  fetchCustomerActivity,
  fetchCustomerOrders,
  updateCustomerRole,
  type CustomerActivity,
} from '@/services/adminService';
import type { Order, UserProfile } from '@/types';

const ROLES = ['customer', 'staff', 'admin'] as const;

export function AdminCustomerDetailPage() {
  return (
    <AdminLayout>
      <CustomerDetailContent />
    </AdminLayout>
  );
}

function CustomerDetailContent() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<CustomerActivity | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('customer');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, a, o] = await Promise.all([
        fetchAdminCustomerById(customerId),
        fetchCustomerActivity(customerId),
        fetchCustomerOrders(customerId),
      ]);
      if (!c) {
        setError('Customer not found');
        return;
      }
      setCustomer(c);
      setActivity(a);
      setOrders(o);
      setNewRole(c.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async () => {
    if (!customer) return;
    setUpdating(true);
    try {
      await updateCustomerRole(customer.id, newRole);
      setCustomer((prev) => (prev ? { ...prev, role: newRole as UserProfile['role'] } : prev));
      setRoleModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading customer…" />;
  if (error && !customer) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/customers')}
          className="inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft size={16} />
          Back to customers
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      {customer && (
        <>
          <PageHeader
            title={`${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email}
            description={customer.email}
            actions={
              <Button variant="outline" onClick={() => setRoleModalOpen(true)}>
                Change Role
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Role" value={customer.role} icon={<Settings size={22} />} accent="primary" />
            <StatCard label="Orders" value={String(activity?.orderCount ?? 0)} icon={<ShoppingBag size={22} />} accent="secondary" />
            <StatCard label="Total Spent" value={formatMoney(activity?.totalSpentCents ?? 0)} icon={<Star size={22} />} accent="accent" />
            <StatCard label="Reviews" value={String(activity?.reviewCount ?? 0)} icon={<Heart size={22} />} accent="warning" />
          </div>

          <div className="mt-8 surface-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Profile Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-ink-400" />
                <div>
                  <p className="text-xs text-ink-500">Email</p>
                  <p className="text-sm font-medium text-ink-800">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-ink-400" />
                <div>
                  <p className="text-xs text-ink-500">Joined</p>
                  <p className="text-sm font-medium text-ink-800">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Order History</h2>
            <DataTable
              columns={[
                {
                  key: 'id',
                  header: 'Order',
                  render: (o: Order) => (
                    <span className="font-mono text-xs text-ink-500">{o.id.slice(0, 8)}</span>
                  ),
                },
                {
                  key: 'date',
                  header: 'Date',
                  render: (o: Order) => new Date(o.createdAt).toLocaleDateString(),
                },
                {
                  key: 'items',
                  header: 'Items',
                  render: (o: Order) => String(o.items.length),
                },
                {
                  key: 'total',
                  header: 'Total',
                  render: (o: Order) => formatMoney(o.totalCents),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (o: Order) => (
                    <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : o.status === 'pending' ? 'warning' : 'primary'}>
                      {o.status}
                    </Badge>
                  ),
                },
              ]}
              data={orders}
              rowKey={(o) => o.id}
              onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
              emptyMessage="No orders yet"
            />
          </div>
        </>
      )}

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Change Customer Role">
        <p className="text-sm text-ink-600">
          Update the role for <strong>{customer?.email}</strong>. This affects what they can access.
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">New Role</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="h-11 w-full rounded-lg border border-ink-300 bg-white px-3.5 text-sm text-ink-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
          <Button isLoading={updating} onClick={handleRoleChange}>Update Role</Button>
        </div>
      </Modal>
    </>
  );
}
