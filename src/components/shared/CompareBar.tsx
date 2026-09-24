import { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { GitCompare, X } from "lucide-react";
import { Button } from "@/components/vui";
import { useCompare, MAX_COMPARE } from "@/context";
import { fetchProductsByIds } from "@/services/productService";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Sticky comparison tray. Appears once a shopper selects a frame to compare
 * and links through to the full comparison table.
 */
export function CompareBar() {
  const { items, remove, clear, count } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const key = items.join(",");

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      return;
    }
    let active = true;
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

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/90 backdrop-blur-xl animate-slide-up">
      <div className="container-app flex flex-wrap items-center gap-4 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <GitCompare size={16} className="text-primary-600" />
          Compare
          <span className="text-ink-400">
            {count}/{MAX_COMPARE}
          </span>
        </div>

        <ul className="flex flex-1 flex-wrap items-center gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1.5 pl-1.5 pr-2"
            >
              <img
                src={product.images[0]?.url ?? ""}
                alt=""
                loading="lazy"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <span className="max-w-[10rem] truncate text-sm text-ink-800">{product.name}</span>
              <span className="text-xs text-ink-500">{formatMoney(product.priceCents)}</span>
              <button
                type="button"
                aria-label={`Remove ${product.name} from comparison`}
                onClick={() => remove(product.id)}
                className="rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="text-sm text-ink-500 transition-colors hover:text-ink-800"
          >
            Clear
          </button>
          <Link to="/compare">
            <Button disabled={count < 2}>Compare {count > 1 ? `${count} frames` : ""}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
