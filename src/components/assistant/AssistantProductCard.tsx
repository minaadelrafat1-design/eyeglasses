import { formatMoney } from '@/lib/utils';
import { Link } from '@/lib/navigation';
import type { AssistantProductRef } from '@/types/assistant';

/**
 * Compact frame card rendered inside an assistant reply. Presentation only —
 * the assistant decides which frames appear.
 */
export function AssistantProductCard({
  product,
  onNavigate,
}: {
  product: AssistantProductRef;
  onNavigate: () => void;
}) {
  const onSale =
    product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;

  return (
    <div className="flex gap-3 rounded-xl border border-ink-200 bg-white p-2.5 transition-colors hover:border-primary-300">
      <Link
        to={product.productPath}
        onClick={onNavigate}
        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={product.productPath}
          onClick={onNavigate}
          className="block truncate text-sm font-medium text-ink-900 hover:text-primary-700"
        >
          {product.name}
        </Link>
        <p className="truncate text-xs text-ink-500">
          {[product.brandName, product.shape, product.material].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium text-ink-900">
            {formatMoney(product.priceCents)}
          </span>
          {onSale ? (
            <span className="text-xs text-ink-400 line-through">
              {formatMoney(product.compareAtPriceCents ?? 0)}
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="text-xs text-ink-400">Out of stock</span>
          ) : null}
        </div>
        <Link
          to={product.tryOnPath}
          onClick={onNavigate}
          className="mt-1.5 inline-block text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
        >
          Try it on
        </Link>
      </div>
    </div>
  );
}
