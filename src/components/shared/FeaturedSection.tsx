import { Link } from '@/lib/navigation';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { getFeaturedProducts } from '@/data/catalog';

export function FeaturedSection() {
  const featured = getFeaturedProducts();

  return (
    <section className="container-app py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Featured frames</h2>
          <p className="mt-2 text-ink-500">Our most-loved styles, chosen by customers.</p>
        </div>
        <Link
          to="/shop"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
        >
          View all
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
