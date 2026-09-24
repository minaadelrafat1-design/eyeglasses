import { Scan, Sparkles, Eye, Heart, Award, Leaf } from 'lucide-react';

const stats = [
  { value: '120+', label: 'Curated frames' },
  { value: '50k+', label: 'Happy wearers' },
  { value: '4.8', label: 'Average rating' },
  { value: '30', label: 'Countries shipped' },
];

const values = [
  {
    icon: Award,
    title: 'Crafted to last',
    description: 'We partner with family-run workshops in Italy and Japan to build frames that endure.',
  },
  {
    icon: Leaf,
    title: 'Responsibly sourced',
    description: 'Bio-acetate, recycled metals, and plastic-free packaging on every order.',
  },
  {
    icon: Heart,
    title: 'Designed for you',
    description: 'Our AI tools help you find the pair that fits your face and your style.',
  },
];

export function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="container-app py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-800">
              <Sparkles size={14} />
              Our Story
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Eyewear, reimagined for the digital age
            </h1>
            <p className="mt-6 text-lg text-ink-600 text-pretty">
              Vuera was born from a simple idea: buying glasses online shouldn't be a guess.
              We blend traditional craftsmanship with intelligent tools so you can find frames
              you'll love — without leaving home.
            </p>
          </div>
        </div>
      </section>

      {/* Image band */}
      <section className="container-app">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="overflow-hidden rounded-2xl md:col-span-2">
            <img
              src="https://images.pexels.com/photos/5201890/pexels-photo-5201890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Vuera optical store"
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img
              src="https://images.pexels.com/photos/23827144/pexels-photo-23827144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Vuera eyewear display"
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-app py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-semibold text-primary-700">{stat.value}</p>
              <p className="mt-1 text-sm text-ink-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-ink-900 py-20 text-white">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What we stand for</h2>
            <p className="mt-4 text-white/70 text-pretty">
              Three principles guide every frame we make and every tool we build.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((val) => (
              <div
                key={val.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-primary-300">
                  <val.icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{val.title}</h3>
                <p className="mt-2 text-sm text-white/70 text-pretty">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI promise */}
      <section className="container-app py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for what's next</h2>
          <p className="mt-4 text-ink-500 text-pretty">
            Our platform is designed around three intelligent tools that will change how you shop for eyewear.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="surface-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Scan size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Live AR Try-On</h3>
            <p className="mt-2 text-sm text-ink-500 text-pretty">
              See frames on your face in real time, right from your phone.
            </p>
          </div>
          <div className="surface-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Sparkles size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">AI-Generated Imagery</h3>
            <p className="mt-2 text-sm text-ink-500 text-pretty">
              Generate photorealistic try-on photos from a single selfie.
            </p>
          </div>
          <div className="surface-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Eye size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Recommendation Assistant</h3>
            <p className="mt-2 text-sm text-ink-500 text-pretty">
              Describe your style and get matched to frames made for you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
