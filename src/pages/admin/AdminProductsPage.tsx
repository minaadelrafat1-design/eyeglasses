import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@/lib/navigation';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { DataTable } from '@/components/admin/DataTable';
import { Button, Badge, Input, Modal } from '@/components/vui';
import { formatMoney, cx } from '@/lib/utils';
import {
  fetchAdminProducts,
  deleteProduct,
  type AdminProduct,
} from '@/services/adminService';

export function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsContent />
    </AdminLayout>
  );
}

function ProductsContent() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading products…" />;
  if (error && products.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your eyewear catalog, pricing, and inventory."
        actions={
          <Button onClick={() => navigate('/admin/products/new')}>
            <Plus size={18} />
            Add Product
          </Button>
        }
      />

      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      <DataTable
        columns={[
          {
            key: 'image',
            header: '',
            render: (p: AdminProduct) => (
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-ink-100">
                {p.images[0] && (
                  <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>
            ),
            className: 'w-16',
          },
          {
            key: 'name',
            header: 'Name',
            render: (p: AdminProduct) => (
              <div>
                <p className="font-medium text-ink-800">{p.name}</p>
                <p className="text-xs text-ink-500">{p.slug}</p>
              </div>
            ),
          },
          { key: 'brand', header: 'Brand', render: (p: AdminProduct) => p.brandName ?? '—' },
          { key: 'price', header: 'Price', render: (p: AdminProduct) => formatMoney(p.priceCents) },
          {
            key: 'stock',
            header: 'Stock',
            render: (p: AdminProduct) => {
              const total = p.variants.reduce((sum, v) => sum + v.stock, 0);
              return <span className={cx(total <= 10 ? 'text-warning-600 font-medium' : 'text-ink-600')}>{total}</span>;
            },
          },
          {
            key: 'status',
            header: 'Status',
            render: (p: AdminProduct) => (
              <Badge variant={p.status === 'active' ? 'success' : p.status === 'draft' ? 'neutral' : 'warning'}>
                {p.status}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (p: AdminProduct) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${p.slug}`); }}
                  className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                  className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-error-50 hover:text-error-600"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
            className: 'text-right',
          },
        ]}
        data={filtered}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/admin/products/${p.slug}`)}
        emptyMessage="No products found"
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete product?"
      >
        <p className="text-sm text-ink-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
          cannot be undone, and all associated images and variants will be removed.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
