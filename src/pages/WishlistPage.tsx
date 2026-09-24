import { useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import { Button, Spinner } from '@/components/vui';
import { ProductCard } from '@/components/shared';
import { useWishlist } from '@/context';
import { fetchProducts } from '@/services/productService';
import type { Product } from '@/types';

export function WishlistPage() {
  const { items } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProducts({ pageSize: 100 })
      .then((result) => {
        if (!active) return;
        const wishlisted = result.items.filter((p) => items.includes(p.id));
        setProducts(wishlisted);
      })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [items]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="container-app py-16 md:py-24">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <Heart size={36} className="text-ink-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Your wishlist is empty</h1>
            <p className="mt-2 text-ink-500">
              Tap the heart icon on any frame to save it here for later.
            </p>
            <Link to="/shop" className="mt-6">
              <Button size="lg">
                Browse frames
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Your wishlist</h1>
          <p className="mt-1 text-ink-500">
            {products.length} {products.length === 1 ? 'frame' : 'frames'} saved
          </p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
