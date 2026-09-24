import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { ProductCard } from "@/components/shared";
import { fetchProducts } from "@/services/productService";
import type { Product } from "@/types";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setProducts([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      fetchProducts({ search: term })
        .then((result) => {
          if (active) setProducts(result.items);
        })
        .catch(() => {
          if (active) setProducts([]);
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            setSearched(true);
          }
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-10 md:py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Search</h1>
          <p className="mt-2 text-ink-500">Search our catalog by frame, brand, or style.</p>

          <div className="relative mt-6 max-w-xl">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search frames, brands, styles…"
              className="w-full rounded-full border border-ink-300 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-primary-600" />
          </div>
        ) : searched && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 py-20 text-center">
            <p className="text-lg font-semibold text-ink-700">No results for "{query.trim()}"</p>
            <p className="mt-1 text-sm text-ink-500">
              Try a different frame name, brand, or style.
            </p>
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-ink-500">
              {products.length} {products.length === 1 ? "result" : "results"} for "{query.trim()}"
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon size={36} className="text-ink-300" />
            <p className="mt-4 text-ink-500">Start typing to search the catalog.</p>
          </div>
        )}
      </div>
    </div>
  );
}
