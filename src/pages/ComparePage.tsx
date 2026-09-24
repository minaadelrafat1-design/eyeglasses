import { useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import { Check, GitCompare, Minus, ShoppingBag, X } from 'lucide-react';
import { Button, Spinner } from '@/components/vui';
import { RatingStars } from '@/components/shared';
import { useCart, useCompare } from '@/context';
import { fetchProductsByIds } from '@/services/productService';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types';

interface Row {
  label: string;
  render: (product: Product) => React.ReactNode;
}

const capitalize = (value: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '—';

const ROWS: Row[] = [
  { label: 'Price', render: (p) => <span className="font-semibold text-ink-900">{formatMoney(p.priceCents)}</span> },
  {
    label: 'Was',
    render: (p) =>
      p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents ? (
        <span className="text-ink-400 line-through">{formatMoney(p.compareAtPriceCents)}</span>
      ) : (
        <Minus size={14} className="text-ink-300" />
      ),
  },
  { label: 'Brand', render: (p) => p.brandName ?? '—' },
  { label: 'Shape', render: (p) => capitalize(p.shape) },
  { label: 'Material', render: (p) => capitalize(p.material) },
  { label: 'Gender', render: (p) => capitalize(p.gender) },
  { label: 'Lens type', render: (p) => capitalize(p.lensType) },
  {
    label: 'Rating',
    render: (p) =>
      p.rating ? (
        <span className="flex items-center gap-2">
          <RatingStars rating={p.rating} size={13} />
          <span className="text-xs text-ink-500">({p.reviewCount})</span>
        </span>
      ) : (
        <Minus size={14} className="text-ink-300" />
      ),
  },
  { label: 'Colours', render: (p) => `${p.variants.length} option${p.variants.length === 1 ? '' : 's'}` },
  {
    label: 'In stock',
    render: (p) =>
      p.variants.some((v) => v.stock > 0) ? (
        <Check size={16} className="text-emerald-600" />
      ) : (
        <X size={16} className="text-ink-300" />
      ),
  },
];

export function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const key = items.join(',');

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      return;
    }
    let active = true;
    setProducts(null);
    fetchProductsByIds(items)
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (products === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <GitCompare size={32} className="mx-auto text-ink-300" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nothing to compare yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500 text-pretty">
          Add up to four frames from the shop and see their measurements, materials and prices
          side by side.
        </p>
        <Link to="/shop" className="mt-6 inline-block">
          <Button>Browse frames</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-12 pb-32">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Compare frames</h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} frame{products.length === 1 ? '' : 's'} side by side
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          Clear all
        </button>
      </header>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-36 bg-white text-left align-bottom" />
              {products.map((product) => (
                <th key={product.id} className="w-64 p-3 text-left align-bottom">
                  <div className="surface-card relative overflow-hidden p-3">
                    <button
                      type="button"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => remove(product.id)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-ink-500 backdrop-blur transition-colors hover:text-ink-900"
                    >
                      <X size={14} />
                    </button>
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={product.images[0]?.url ?? ''}
                        alt={product.name}
                        loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <h2 className="mt-3 text-sm font-medium text-ink-900">{product.name}</h2>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, index) => (
              <tr key={row.label} className={index % 2 === 0 ? 'bg-ink-50/60' : undefined}>
                <th className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-3 text-sm text-ink-700">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-white" />
              {products.map((product) => {
                const variant = product.variants[0];
                return (
                  <td key={product.id} className="px-3 pt-4">
                    <Button
                      className="w-full"
                      disabled={!variant}
                      onClick={() =>
                        variant &&
                        addItem({
                          productId: product.id,
                          variantId: variant.id,
                          name: `${product.name} — ${variant.name}`,
                          image: product.images[0]?.url ?? '',
                          unitPriceCents: variant.priceCents,
                          quantity: 1,
                        })
                      }
                    >
                      <ShoppingBag size={16} />
                      Add to bag
                    </Button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
