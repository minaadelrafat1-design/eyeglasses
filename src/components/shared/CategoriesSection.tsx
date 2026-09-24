import { Link } from '@/lib/navigation';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/data/catalog';

const categoryImages: Record<string, string> = {
  optical: 'https://images.pexels.com/photos/5201896/pexels-photo-5201896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  sunglasses: 'https://images.pexels.com/photos/5202048/pexels-photo-5202048.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'blue-light': 'https://images.pexels.com/photos/5752270/pexels-photo-5752270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  readers: 'https://images.pexels.com/photos/5201988/pexels-photo-5201988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function CategoriesSection() {
  return (
    <section className="container-app py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Shop by category</h2>
          <p className="mt-2 text-ink-500">Find the right frames for every moment.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop/${cat.slug}`}
            className="group relative overflow-hidden rounded-2xl"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={categoryImages[cat.slug]}
                alt={cat.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-emphasized)] group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
              <p className="mt-1 text-sm text-white/80 line-clamp-1">{cat.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                Shop now
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
