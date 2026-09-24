import { useEffect, useState, useCallback } from 'react';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { AdminLayout, StatCard, ErrorState, LoadingState, PageHeader } from '@/components/admin';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/vui';
import { formatMoney } from '@/lib/utils';
import {
  fetchDashboardSummary,
  fetchBestSellers,
  fetchLowStock,
  fetchRevenueByDay,
  fetchRecentOrders,
  type DashboardSummary,
  type BestSeller,
  type LowStockItem,
  type RevenuePoint,
  type RecentOrder,
} from '@/services/adminService';

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, bs, ls, rev, ro] = await Promise.all([
        fetchDashboardSummary(),
        fetchBestSellers(5),
        fetchLowStock(10),
        fetchRevenueByDay(30),
        fetchRecentOrders(8),
      ]);
      setSummary(s);
      setBestSellers(bs);
      setLowStock(ls);
      setRevenue(rev);
      setRecentOrders(ro);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const maxRevenue = Math.max(...revenue.map((r) => r.revenueCents), 1);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of sales, orders, and inventory at a glance."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Sales"
          value={formatMoney(summary?.totalSalesCents ?? 0)}
          icon={<DollarSign size={22} />}
          accent="primary"
        />
        <StatCard
          label="Total Orders"
          value={String(summary?.totalOrders ?? 0)}
          icon={<ShoppingCart size={22} />}
          accent="secondary"
        />
        <StatCard
          label="Customers"
          value={String(summary?.totalCustomers ?? 0)}
          icon={<Users size={22} />}
          accent="accent"
        />
        <StatCard
          label="Products"
          value={String(summary?.totalProducts ?? 0)}
          icon={<Package size={22} />}
          accent="primary"
        />
        <StatCard
          label="Low Stock"
          value={String(summary?.lowStockVariants ?? 0)}
          icon={<AlertTriangle size={22} />}
          accent="warning"
        />
        <StatCard
          label="Pending Orders"
          value={String(summary?.pendingOrders ?? 0)}
          icon={<Clock size={22} />}
          accent="error"
        />
      </div>

      {/* Revenue chart */}
      <div className="mt-8 surface-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Revenue (Last 30 Days)</h2>
            <p className="mt-0.5 text-sm text-ink-500">Daily revenue from paid and fulfilled orders</p>
          </div>
          <TrendingUp size={20} className="text-primary-500" />
        </div>
        {revenue.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-ink-400">
            No revenue data yet
          </div>
        ) : (
          <div className="flex h-48 items-end gap-1">
            {revenue.map((point) => (
              <div
                key={point.day}
                className="group relative flex-1"
                title={`${point.day}: ${formatMoney(point.revenueCents)}`}
              >
                <div
                  className="w-full rounded-t-md bg-primary-500 transition-all duration-300 hover:bg-primary-600"
                  style={{ height: `${Math.max((point.revenueCents / maxRevenue) * 100, 2)}%` }}
                />
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {formatMoney(point.revenueCents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Best sellers */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Best Sellers</h2>
          <DataTable
            columns={[
              { key: 'name', header: 'Product', render: (r: BestSeller) => <span className="font-medium text-ink-800">{r.productName}</span> },
              { key: 'units', header: 'Units', render: (r: BestSeller) => String(r.unitsSold) },
              { key: 'revenue', header: 'Revenue', render: (r: BestSeller) => formatMoney(r.revenueCents), className: 'text-right' },
            ]}
            data={bestSellers}
            rowKey={(r) => r.productId}
            emptyMessage="No sales data yet"
          />
        </div>

        {/* Low stock alerts */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Inventory Alerts</h2>
          <DataTable
            columns={[
              { key: 'name', header: 'Product', render: (r: LowStockItem) => (
                <div>
                  <p className="font-medium text-ink-800">{r.productName}</p>
                  <p className="text-xs text-ink-500">{r.variantName}</p>
                </div>
              )},
              { key: 'sku', header: 'SKU', render: (r: LowStockItem) => <span className="text-xs text-ink-500">{r.sku}</span> },
              { key: 'stock', header: 'Stock', render: (r: LowStockItem) => (
                <Badge variant={r.stock === 0 ? 'error' : 'warning'}>{r.stock} left</Badge>
              )},
            ]}
            data={lowStock}
            rowKey={(r) => r.variantId}
            emptyMessage="All variants well stocked"
          />
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Recent Orders</h2>
        <DataTable
          columns={[
            { key: 'email', header: 'Customer', render: (r: RecentOrder) => r.customerEmail || '—' },
            { key: 'items', header: 'Items', render: (r: RecentOrder) => String(r.itemCount) },
            { key: 'total', header: 'Total', render: (r: RecentOrder) => formatMoney(r.totalCents) },
            { key: 'status', header: 'Status', render: (r: RecentOrder) => <OrderStatusBadge status={r.status} /> },
            { key: 'date', header: 'Date', render: (r: RecentOrder) => new Date(r.createdAt).toLocaleDateString() },
          ]}
          data={recentOrders}
          rowKey={(r) => r.orderId}
          emptyMessage="No orders yet"
        />
      </div>
    </>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const variant = status === 'pending' ? 'warning' : status === 'delivered' ? 'success' : status === 'cancelled' || status === 'refunded' ? 'error' : 'primary';
  return <Badge variant={variant}>{status}</Badge>;
}
