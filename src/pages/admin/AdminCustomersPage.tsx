import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/navigation';
import { ChevronRight } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { DataTable } from '@/components/admin/DataTable';
import { Badge, Input } from '@/components/vui';
import {
  fetchAdminCustomers,
  fetchCustomerActivity,
  type CustomerActivity,
} from '@/services/adminService';
import type { UserProfile } from '@/types';

interface CustomerWithActivity {
  profile: UserProfile;
  activity: CustomerActivity | null;
}

export function AdminCustomersPage() {
  return (
    <AdminLayout>
      <CustomersContent />
    </AdminLayout>
  );
}

function CustomersContent() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profiles = await fetchAdminCustomers();
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          try {
            const activity = await fetchCustomerActivity(p.id);
            return { profile: p, activity };
          } catch {
            return { profile: p, activity: null };
          }
        }),
      );
      setCustomers(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = customers.filter(
    (c) =>
      c.profile.email.toLowerCase().includes(search.toLowerCase()) ||
      `${c.profile.firstName ?? ''} ${c.profile.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <LoadingState message="Loading customers…" />;
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Customers"
        description="View customer profiles, order history, and activity."
      />

      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (c: CustomerWithActivity) => (
              <div>
                <p className="font-medium text-ink-800">
                  {c.profile.firstName ?? ''} {c.profile.lastName ?? ''}
                </p>
                <p className="text-xs text-ink-500">{c.profile.email}</p>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (c: CustomerWithActivity) => (
              <Badge variant={c.profile.role === 'admin' ? 'primary' : c.profile.role === 'staff' ? 'secondary' : 'neutral'}>
                {c.profile.role}
              </Badge>
            ),
          },
          {
            key: 'orders',
            header: 'Orders',
            render: (c: CustomerWithActivity) => String(c.activity?.orderCount ?? 0),
          },
          {
            key: 'spent',
            header: 'Total Spent',
            render: (c: CustomerWithActivity) => {
              const cents = c.activity?.totalSpentCents ?? 0;
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
            },
          },
          {
            key: 'joined',
            header: 'Joined',
            render: (c: CustomerWithActivity) => new Date(c.profile.createdAt).toLocaleDateString(),
          },
          {
            key: 'action',
            header: '',
            render: () => <ChevronRight size={16} className="text-ink-400" />,
            className: 'text-right',
          },
        ]}
        data={filtered}
        rowKey={(c) => c.profile.id}
        onRowClick={(c) => navigate(`/admin/customers/${c.profile.id}`)}
        emptyMessage="No customers found"
      />
    </>
  );
}
