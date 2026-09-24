import { Sparkles } from 'lucide-react';

const STEPS = [
  'Reading your photo',
  'Matching the frame shape and colour',
  'Fitting the frames to your face',
  'Polishing lighting and reflections',
];

/** Animated placeholder shown while the AI composes the try-on image. */
export function TryOnLoader({ step = 0 }: { step?: number }) {
  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl bg-ink-100">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary-500/25" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-ink-800">Generating your try-on</p>
      <ul className="mt-3 space-y-1 text-center text-xs text-ink-500">
        {STEPS.map((label, index) => (
          <li key={label} className={index <= step ? 'text-ink-700' : 'opacity-50'}>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
