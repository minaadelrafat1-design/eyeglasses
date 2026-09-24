import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { useRecentlyViewed } from "@/context";
import { fetchProductsByIds } from "@/services/productService";
import type { Product } from "@/types";

export interface RecentlyViewedProductsProps {
  /** Product currently on screen, excluded from the row. */
  excludeId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

/** Horizontal row of the shopper's recently viewed frames. */
export function RecentlyViewedProducts({
  excludeId,
  limit = 4,
  title = "Recently viewed",
  className,
}: RecentlyViewedProductsProps) {
  const { items } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);

  const ids = items.filter((id) => id !== excludeId).slice(0, limit);
  const key = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    let active = true;
    fetchProductsByIds(ids)
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

  if (products.length === 0) return null;

  return (
    <section className={className} aria-label={title}>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
