import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/vui';
import { cx } from '@/lib/utils';
import type { FrameShape, FrameMaterial, GenderTarget, LensType, Brand, Color } from '@/types';

export interface FilterState {
  shapes: FrameShape[];
  materials: FrameMaterial[];
  genders: GenderTarget[];
  lensTypes: LensType[];
  brands: string[];
  colors: string[];
  onSale: boolean;
  inStock: boolean;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  sort: SortOption;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

export const defaultFilters: FilterState = {
  shapes: [],
  materials: [],
  genders: [],
  lensTypes: [],
  brands: [],
  colors: [],
  onSale: false,
  inStock: false,
  minPriceCents: null,
  maxPriceCents: null,
  sort: 'newest',
};

const PRICE_MIN = 0;
const PRICE_MAX = 30000;
const PRICE_STEP = 500;

interface FilterGroupProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({ title, options, selected, onToggle }: FilterGroupProps) {
  return (
    <div className="border-b border-ink-200 py-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-900">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={cx(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-ink-300 bg-white text-ink-600 hover:border-ink-400',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  brands?: Brand[];
  colors?: Color[];
}

const shapeOptions: { value: string; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'oval', label: 'Oval' },
  { value: 'cat-eye', label: 'Cat-eye' },
  { value: 'aviator', label: 'Aviator' },
  { value: 'geometric', label: 'Geometric' },
];

const materialOptions: { value: string; label: string }[] = [
  { value: 'acetate', label: 'Acetate' },
  { value: 'metal', label: 'Metal' },
  { value: 'titanium', label: 'Titanium' },
  { value: 'mixed', label: 'Mixed' },
];

const genderOptions: { value: string; label: string }[] = [
  { value: 'unisex', label: 'Unisex' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
];

const lensOptions: { value: string; label: string }[] = [
  { value: 'single-vision', label: 'Optical' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'progressive', label: 'Progressive' },
  { value: 'reading', label: 'Readers' },
  { value: 'non-prescription', label: 'Non-Prescription' },
];

export function ProductFilters({ filters, onChange, className, mobileOpen, onCloseMobile, brands = [], colors = [] }: ProductFiltersProps) {
  const toggle = (key: keyof Pick<FilterState, 'shapes' | 'materials' | 'genders' | 'lensTypes' | 'brands' | 'colors'>, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const reset = () => onChange(defaultFilters);

  const priceLabel = (() => {
    const min = filters.minPriceCents ?? PRICE_MIN;
    const max = filters.maxPriceCents ?? PRICE_MAX;
    const fmt = (cents: number) => `${(cents / 100).toFixed(0)}`;
    if (min === PRICE_MIN && max === PRICE_MAX) return 'All prices';
    if (max === PRICE_MAX) return `${fmt(min)}+`;
    return `${fmt(min)} – ${fmt(max)}`;
  })();

  const content = (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <SlidersHorizontal size={18} />
          Filters
        </h2>
        <button
          type="button"
          onClick={reset}
          className="text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          Reset
        </button>
      </div>

      <FilterGroup
        title="Shape"
        options={shapeOptions}
        selected={filters.shapes}
        onToggle={(v) => toggle('shapes', v)}
      />
      <FilterGroup
        title="Material"
        options={materialOptions}
        selected={filters.materials}
        onToggle={(v) => toggle('materials', v)}
      />
      <FilterGroup
        title="Gender"
        options={genderOptions}
        selected={filters.genders}
        onToggle={(v) => toggle('genders', v)}
      />
      <FilterGroup
        title="Type"
        options={lensOptions}
        selected={filters.lensTypes}
        onToggle={(v) => toggle('lensTypes', v)}
      />

      {/* Price range */}
      <div className="py-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Price range</h3>
        <p className="mb-3 text-xs text-ink-500">{priceLabel}</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={filters.minPriceCents ?? PRICE_MIN}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange({ ...filters, minPriceCents: val > PRICE_MIN ? val : null });
            }}
            className="flex-1 accent-primary-600"
            aria-label="Minimum price"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={filters.maxPriceCents ?? PRICE_MAX}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange({ ...filters, maxPriceCents: val < PRICE_MAX ? val : null });
            }}
            className="flex-1 accent-primary-600"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Brand filter */}
      {brands.length > 0 && (
        <FilterGroup
          title="Brand"
          options={brands.map((b) => ({ value: b.slug, label: b.name }))}
          selected={filters.brands}
          onToggle={(v) => toggle('brands', v)}
        />
      )}

      {/* Color filter */}
      {colors.length > 0 && (
        <div className="py-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Color</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const active = filters.colors.includes(color.slug);
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => toggle('colors', color.slug)}
                  aria-label={color.name}
                  title={color.name}
                  className={cx(
                    'h-8 w-8 rounded-full border-2 transition-all',
                    active ? 'border-primary-600 ring-2 ring-primary-200' : 'border-ink-200 hover:border-ink-400',
                  )}
                  style={color.hexCode ? { backgroundColor: color.hexCode } : undefined}
                >
                  {!color.hexCode && (
                    <span className="text-xs text-ink-500">{color.name.charAt(0)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability */}
      <div className="space-y-3 py-5">
        <h3 className="text-sm font-semibold text-ink-900">Availability</h3>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => onChange({ ...filters, onSale: e.target.checked })}
            className="h-5 w-5 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-ink-700">On sale only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="h-5 w-5 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-ink-700">In stock only</span>
        </label>
      </div>
    </div>
  );

  if (mobileOpen !== undefined) {
    return (
      <>
        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onCloseMobile} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 animate-slide-up">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-semibold">Filters</span>
                <button onClick={onCloseMobile} aria-label="Close filters" className="rounded-md p-1.5 hover:bg-ink-100">
                  <X size={20} />
                </button>
              </div>
              {content}
              <Button fullWidth className="mt-6" onClick={onCloseMobile}>
                Show results
              </Button>
            </div>
          </div>
        )}
        {/* Desktop sidebar */}
        <aside className={cx('hidden lg:block', className)}>
          <div className="sticky top-24 rounded-2xl border border-ink-200 bg-white p-6">
            {content}
          </div>
        </aside>
      </>
    );
  }

  return <div className={className}>{content}</div>;
}
