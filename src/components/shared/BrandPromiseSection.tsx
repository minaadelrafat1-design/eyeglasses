import { Scan, Sparkles, Eye, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const values = [
  {
    icon: ShieldCheck,
    title: '2-year warranty',
    description: 'Every frame is backed against manufacturing defects.',
  },
  {
    icon: Truck,
    title: 'Free shipping',
    description: 'Complimentary delivery on all orders, everywhere.',
  },
  {
    icon: RefreshCw,
    title: '30-day returns',
    description: 'Not the right fit? Send them back, on us.',
  },
];

const aiFeatures = [
  {
    icon: Scan,
    title: 'Live AR Try-On',
    description: 'See frames on your face in real time using your camera.',
  },
  {
    icon: Sparkles,
    title: 'AI-Generated Imagery',
    description: 'Generate photorealistic try-on photos from a single selfie.',
  },
  {
    icon: Eye,
    title: 'Recommendation Assistant',
    description: 'Describe your style and get matched to the perfect pair.',
  },
];

export function BrandPromiseSection() {
  return (
    <section className="bg-ink-900 text-white">
      {/* AI features */}
      <div className="container-app py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white">
            <Sparkles size={14} />
            Powered by AI
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
            The future of finding frames
          </h2>
          <p className="mt-4 text-white/70 text-pretty">
            Three intelligent tools that take the guesswork out of buying glasses online.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {aiFeatures.map((feat) => (
            <div
              key={feat.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center transition-colors hover:bg-white/10"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-primary-300">
                <feat.icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{feat.title}</h3>
              <p className="mt-2 text-sm text-white/70 text-pretty">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Service values */}
      <div className="border-t border-white/10">
        <div className="container-app py-14">
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((val) => (
              <div key={val.title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <val.icon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{val.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
