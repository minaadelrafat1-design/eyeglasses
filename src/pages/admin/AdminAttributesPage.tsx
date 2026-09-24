import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { Button, Input, Modal } from '@/components/vui';
import {
  fetchAdminBrands,
  createBrand,
  deleteBrand,
  fetchAdminCategories,
  createCategory,
  deleteCategory,
  fetchAdminColors,
  createColor,
  deleteColor,
  fetchAdminFrameShapes,
  createFrameShape,
  deleteFrameShape,
  fetchAdminMaterials,
  createMaterial,
  deleteMaterial,
  fetchAdminSizes,
  createSize,
  deleteSize,
} from '@/services/adminService';
import type { Brand, Category, Color, FrameShapeOption, MaterialOption, SizeOption } from '@/types';

type Tab = 'brands' | 'categories' | 'colors' | 'shapes' | 'materials' | 'sizes';

const TABS: { key: Tab; label: string }[] = [
  { key: 'brands', label: 'Brands' },
  { key: 'categories', label: 'Categories' },
  { key: 'colors', label: 'Colors' },
  { key: 'shapes', label: 'Frame Shapes' },
  { key: 'materials', label: 'Materials' },
  { key: 'sizes', label: 'Sizes' },
];

export function AdminAttributesPage() {
  return (
    <AdminLayout>
      <AttributesContent />
    </AdminLayout>
  );
}

function AttributesContent() {
  const [activeTab, setActiveTab] = useState<Tab>('brands');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [shapes, setShapes] = useState<FrameShapeOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHex, setFormHex] = useState('');
  const [formSizeMm, setFormSizeMm] = useState('');
  const [formLabel, setFormLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c, col, sh, mat, sz] = await Promise.all([
        fetchAdminBrands(),
        fetchAdminCategories(),
        fetchAdminColors(),
        fetchAdminFrameShapes(),
        fetchAdminMaterials(),
        fetchAdminSizes(),
      ]);
      setBrands(b);
      setCategories(c);
      setColors(col);
      setShapes(sh);
      setMaterials(mat);
      setSizes(sz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attributes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormHex('');
    setFormSizeMm('');
    setFormLabel('');
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

  const handleAdd = async () => {
    setSubmitting(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'brands':
          await createBrand(formName, formSlug || slugify(formName), formDesc || undefined);
          break;
        case 'categories':
          await createCategory(formSlug || slugify(formName), formName, formDesc || undefined);
          break;
        case 'colors':
          await createColor(formName, formSlug || slugify(formName), formHex || undefined);
          break;
        case 'shapes':
          await createFrameShape(formSlug || slugify(formName), formName);
          break;
        case 'materials':
          await createMaterial(formSlug || slugify(formName), formName);
          break;
        case 'sizes':
          await createSize(Number(formSizeMm), formLabel || `${formSizeMm}mm`);
          break;
      }
      setAddModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create attribute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      switch (activeTab) {
        case 'brands': await deleteBrand(deleteTarget.id); break;
        case 'categories': await deleteCategory(deleteTarget.id); break;
        case 'colors': await deleteColor(deleteTarget.id); break;
        case 'shapes': await deleteFrameShape(deleteTarget.id); break;
        case 'materials': await deleteMaterial(deleteTarget.id); break;
        case 'sizes': await deleteSize(deleteTarget.id); break;
      }
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading attributes…" />;
  if (error && brands.length === 0) return <ErrorState message={error} onRetry={load} />;

  const currentLabel = TABS.find((t) => t.key === activeTab)?.label ?? '';
  const currentSingular = currentLabel.slice(0, -1);

  const renderRows = () => {
    switch (activeTab) {
      case 'brands':
        return brands.map((b) => (
          <tr key={b.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{b.name}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{b.slug}</td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: b.id, name: b.name })} />
            </td>
          </tr>
        ));
      case 'categories':
        return categories.map((c) => (
          <tr key={c.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{c.name}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{c.slug}</td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: c.id, name: c.name })} />
            </td>
          </tr>
        ));
      case 'colors':
        return colors.map((c) => (
          <tr key={c.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{c.name}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{c.slug}</td>
            <td className="px-4 py-3.5">
              {c.hexCode && (
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border border-ink-200" style={{ backgroundColor: c.hexCode }} />
                  <span className="text-xs text-ink-500">{c.hexCode}</span>
                </div>
              )}
            </td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: c.id, name: c.name })} />
            </td>
          </tr>
        ));
      case 'shapes':
        return shapes.map((s) => (
          <tr key={s.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{s.name}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{s.slug}</td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: s.id, name: s.name })} />
            </td>
          </tr>
        ));
      case 'materials':
        return materials.map((m) => (
          <tr key={m.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{m.name}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{m.slug}</td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: m.id, name: m.name })} />
            </td>
          </tr>
        ));
      case 'sizes':
        return sizes.map((s) => (
          <tr key={s.id} className="hover:bg-ink-50">
            <td className="px-4 py-3.5 text-sm font-medium text-ink-800">{s.label}</td>
            <td className="px-4 py-3.5 text-sm text-ink-500">{s.sizeMm}mm</td>
            <td className="px-4 py-3.5 text-right">
              <DeleteButton onClick={() => setDeleteTarget({ id: s.id, name: s.label })} />
            </td>
          </tr>
        ));
    }
  };

  const itemCount = (() => {
    switch (activeTab) {
      case 'brands': return brands.length;
      case 'categories': return categories.length;
      case 'colors': return colors.length;
      case 'shapes': return shapes.length;
      case 'materials': return materials.length;
      case 'sizes': return sizes.length;
    }
  })();

  return (
    <>
      <PageHeader
        title="Attributes"
        description="Manage brands, categories, colors, frame shapes, materials, and sizes."
        actions={
          <Button onClick={openAddModal}>
            <Plus size={18} />
            Add {currentSingular}
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? 'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors'
                : 'rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Slug</th>
                {activeTab === 'colors' && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Color</th>}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {renderRows()}
            </tbody>
          </table>
        </div>
        {itemCount === 0 && (
          <div className="p-12 text-center text-sm text-ink-400">No items yet</div>
        )}
      </div>

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title={`Add ${currentSingular}`}>
        <div className="space-y-4">
          {activeTab === 'sizes' ? (
            <>
              <Input label="Size (mm)" type="number" value={formSizeMm} onChange={(e) => setFormSizeMm(e.target.value)} placeholder="52" />
              <Input label="Label" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="52mm" />
            </>
          ) : (
            <>
              <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Ray-Ban" />
              <Input label="Slug (optional)" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="auto-generated from name" />
              {(activeTab === 'brands' || activeTab === 'categories') && (
                <Input label="Description (optional)" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              )}
              {activeTab === 'colors' && (
                <Input label="Hex Code (optional)" value={formHex} onChange={(e) => setFormHex(e.target.value)} placeholder="#000000" />
              )}
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button isLoading={submitting} onClick={handleAdd}>Create</Button>
        </div>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete?">
        <p className="text-sm text-ink-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={submitting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-error-50 hover:text-error-600"
      aria-label="Delete"
    >
      <Trash2 size={16} />
    </button>
  );
}
