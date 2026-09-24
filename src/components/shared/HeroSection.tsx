import { Link } from '@/lib/navigation';
import { ArrowRight, Scan, Sparkles } from 'lucide-react';
import { Button } from '@/components/vui';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="container-app">
        <div className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          {/* Copy */}
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-800">
              <Sparkles size={14} />
              AI-Powered Eyewear
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight text-balance md:text-6xl lg:text-7xl">
              See yourself in every pair.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-600 text-pretty">
              Premium frames, intelligent try-on, and a recommendation assistant
              that finds the glasses made for your face.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop">
                <Button size="lg">
                  Shop the collection
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/try-on">
                <Button size="lg" variant="outline">
                  <Scan size={18} />
                  Try on virtually
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex gap-8">
              <div>
                <p className="text-2xl font-semibold text-ink-900">120+</p>
                <p className="text-sm text-ink-500">Frames</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink-900">4.8</p>
                <p className="text-sm text-ink-500">Avg. rating</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink-900">50k+</p>
                <p className="text-sm text-ink-500">Happy wearers</p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in">
            <div className="relative grid grid-cols-2 gap-4">
              <div className="mt-8 overflow-hidden rounded-2xl">
                <img
                  src="https://images.pexels.com/photos/26100579/pexels-photo-26100579.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Model wearing Vuera frames"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="https://images.pexels.com/photos/29301758/pexels-photo-29301758.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Model wearing Vuera sunglasses"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-3 shadow-[var(--shadow-pop)]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <Scan size={16} />
                </span>
                <span className="text-sm font-medium text-ink-800">AR Try-On ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
