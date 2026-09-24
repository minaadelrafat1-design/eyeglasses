import { useEffect, useMemo, useState } from 'react';
import { useParams } from '@/lib/navigation';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ProductCard, ProductFilters, defaultFilters } from '@/components/shared';
import type { FilterState, SortOption } from '@/components/shared';
import { fetchProducts, fetchBrands, fetchColors } from '@/services/productService';
import { getCategoryBySlug } from '@/data/catalog';
import { cx } from '@/lib/utils';
import type { Product, Brand, Color } from '@/types';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export function ShopPage() {
  const { categorySlug } = useParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProducts({
      categorySlug,
      shapes: filters.shapes,
      materials: filters.materials,
      genders: filters.genders,
      lensTypes: filters.lensTypes,
      brands: filters.brands,
      colors: filters.colors,
      onSale: filters.onSale,
      inStock: filters.inStock,
      minPriceCents: filters.minPriceCents ?? undefined,
      maxPriceCents: filters.maxPriceCents ?? undefined,
      sort: filters.sort,
    })
      .then((result) => {
        if (active) setProducts(result.items);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [categorySlug, filters]);

  useEffect(() => {
    fetchBrands().then(setBrands).catch(() => {});
    fetchColors().then(setColors).catch(() => {});
  }, []);

  const title = category ? category.name : 'All Eyewear';
  const subtitle = category ? category.description : 'Explore our full collection of premium frames.';

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-10 md:py-14">
          <nav className="mb-3 text-sm text-ink-500">
            <span>Shop</span>
            {category && <span> / {category.name}</span>}
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 text-ink-500">{subtitle}</p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="flex gap-8">
          <div className="lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {/* Renders the sticky desktop sidebar and the mobile drawer. */}
          <ProductFilters
            filters={filters}
            onChange={setFilters}
            className="w-64 shrink-0"
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            brands={brands}
            colors={colors}
          />


          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-ink-500">
                {loading ? 'Loading…' : `${products.length} ${products.length === 1 ? 'frame' : 'frames'}`}
              </p>
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700"
                >
                  Sort: {sortOptions.find((s) => s.value === filters.sort)?.label}
                  <ChevronDown size={16} className={cx('transition-transform', sortOpen && 'rotate-180')} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-[var(--shadow-pop)]">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilters((f) => ({ ...f, sort: opt.value }));
                          setSortOpen(false);
                        }}
                        className={cx(
                          'block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-ink-50',
                          filters.sort === opt.value ? 'font-semibold text-primary-700' : 'text-ink-600',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-primary-600" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 py-20 text-center">
                <p className="text-lg font-semibold text-ink-700">No frames found</p>
                <p className="mt-1 text-sm text-ink-500">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
