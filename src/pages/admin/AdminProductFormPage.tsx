import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from '@/lib/navigation';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { AdminLayout, PageHeader, ErrorState, LoadingState } from '@/components/admin';
import { Button, Input, Badge } from '@/components/vui';
import { cx } from '@/lib/utils';
import {
  fetchAdminProductBySlug,
  createProduct,
  updateProduct,
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAdminColors,
  fetchAdminFrameShapes,
  fetchAdminMaterials,
  fetchAdminSizes,
  uploadProductImage,
  type AdminProduct,
  type ProductInput,
} from '@/services/adminService';
import type { Brand, Category, Color, FrameShapeOption, MaterialOption, SizeOption } from '@/types';

export function AdminProductFormPage() {
  return (
    <AdminLayout>
      <ProductFormContent />
    </AdminLayout>
  );
}

function ProductFormContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [shapes, setShapes] = useState<FrameShapeOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<ProductInput>({
    slug: '',
    name: '',
    brandId: null,
    description: '',
    shapeId: null,
    materialId: null,
    gender: 'unisex',
    lensType: 'single-vision',
    priceCents: 0,
    compareAtPriceCents: null,
    status: 'active',
    categoryIds: [],
    images: [],
    variants: [],
  });

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

      if (slug) {
        const p = await fetchAdminProductBySlug(slug);
        if (!p) {
          setError('Product not found');
          return;
        }
        setProduct(p);
        setForm({
          slug: p.slug,
          name: p.name,
          brandId: p.brandId,
          description: p.description ?? '',
          shapeId: p.shapeId,
          materialId: p.materialId,
          gender: p.gender,
          lensType: p.lensType,
          priceCents: p.priceCents,
          compareAtPriceCents: p.compareAtPriceCents,
          status: p.status,
          categoryIds: p.categorySlugs
            .map((s) => c.find((cat) => cat.slug === s)?.id)
            .filter(Boolean) as string[],
          images: p.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            position: img.position,
          })),
          variants: p.variants.map((v) => ({
            id: v.id,
            colorId: v.colorId,
            sizeId: v.sizeId,
            name: v.name,
            lensTint: v.lensTint,
            priceCents: v.priceCents,
            stock: v.stock,
            sku: v.sku,
          })),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, form);
      } else {
        await createProduct(form);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => uploadProductImage(file, product?.id ?? 'temp')),
      );
      setForm((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...uploaded.map((url, i) => ({
            url,
            altText: null,
            position: prev.images.length + i,
          })),
        ],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    }
  };

  const addImageUrl = (url: string) => {
    if (!url.trim()) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, altText: null, position: prev.images.length }],
    }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i })),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { colorId: null, sizeId: null, name: '', lensTint: null, priceCents: prev.priceCents, stock: 0, sku: '' },
      ],
    }));
  };

  const updateVariant = (index: number, field: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  if (loading) return <LoadingState message="Loading product…" />;
  if (error && isEdit && !product) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft size={16} />
          Back to products
        </button>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Product' : 'Add Product'}
        description={isEdit ? product?.name : 'Create a new eyewear product.'}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
            <Button isLoading={saving} onClick={handleSave}>
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

      <div className="space-y-8">
        {/* Basic info */}
        <section className="surface-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Aurora"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="aurora-cat-eye"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              placeholder="Product description…"
            />
          </div>
        </section>

        {/* Attributes */}
        <section className="surface-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Attributes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Brand" value={form.brandId ?? ''} onChange={(v) => setForm((p) => ({ ...p, brandId: v || null }))} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
            <SelectField label="Frame Shape" value={form.shapeId ?? ''} onChange={(v) => setForm((p) => ({ ...p, shapeId: v || null }))} options={shapes.map((s) => ({ value: s.id, label: s.name }))} />
            <SelectField label="Material" value={form.materialId ?? ''} onChange={(v) => setForm((p) => ({ ...p, materialId: v || null }))} options={materials.map((m) => ({ value: m.id, label: m.name }))} />
            <SelectField label="Gender" value={form.gender} onChange={(v) => setForm((p) => ({ ...p, gender: v }))} options={[{ value: 'unisex', label: 'Unisex' }, { value: 'men', label: 'Men' }, { value: 'women', label: 'Women' }]} />
            <SelectField label="Lens Type" value={form.lensType} onChange={(v) => setForm((p) => ({ ...p, lensType: v }))} options={[
              { value: 'single-vision', label: 'Single Vision' },
              { value: 'progressive', label: 'Progressive' },
              { value: 'reading', label: 'Reading' },
              { value: 'non-prescription', label: 'Non-Prescription' },
              { value: 'sunglasses', label: 'Sunglasses' },
            ]} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]} />
          </div>

          {/* Categories */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-ink-700">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cx(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    form.categoryIds.includes(cat.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="surface-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Pricing</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Price (cents)"
              type="number"
              value={form.priceCents}
              onChange={(e) => setForm((p) => ({ ...p, priceCents: Number(e.target.value) }))}
            />
            <Input
              label="Compare-at Price (cents, optional)"
              type="number"
              value={form.compareAtPriceCents ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, compareAtPriceCents: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
        </section>

        {/* Images */}
        <section className="surface-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Images</h2>
          <div className="flex flex-wrap gap-4">
            {form.images.map((img, i) => (
              <div key={i} className="group relative h-28 w-28 overflow-hidden rounded-lg border border-ink-200">
                <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-ink-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-300 text-ink-400 transition-colors hover:border-primary-400 hover:text-primary-500">
              <Upload size={20} />
              <span className="mt-1 text-xs">Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Or paste an image URL…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImageUrl((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
        </section>

        {/* Variants */}
        <section className="surface-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">Variants & Stock</h2>
            <Button variant="outline" size="sm" onClick={addVariant}>
              <Plus size={16} />
              Add Variant
            </Button>
          </div>

          {form.variants.length === 0 ? (
            <p className="text-sm text-ink-400">No variants yet. Add at least one variant with stock.</p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SelectField label="Color" value={v.colorId ?? ''} onChange={(val) => updateVariant(i, 'colorId', val || null)} options={colors.map((c) => ({ value: c.id, label: c.name }))} />
                    <SelectField label="Size" value={v.sizeId ?? ''} onChange={(val) => updateVariant(i, 'sizeId', val || null)} options={sizes.map((s) => ({ value: s.id, label: s.label }))} />
                    <Input label="Variant Name" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} placeholder="Matte Black / 52mm" />
                    <Input label="Lens Tint" value={v.lensTint ?? ''} onChange={(e) => updateVariant(i, 'lensTint', e.target.value || null)} placeholder="Clear" />
                    <Input label="Price (cents)" type="number" value={v.priceCents} onChange={(e) => updateVariant(i, 'priceCents', Number(e.target.value))} />
                    <Input label="Stock" type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))} />
                    <Input label="SKU" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} placeholder="VU-XXX-XX-00" />
                    <div className="flex items-end">
                      <button
                        onClick={() => removeVariant(i)}
                        className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Save bar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button isLoading={saving} onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>
    </>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-ink-300 bg-white px-3.5 text-sm text-ink-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
