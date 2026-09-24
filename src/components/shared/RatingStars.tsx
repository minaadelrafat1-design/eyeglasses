import { Star } from 'lucide-react';
import { cx } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}

export function RatingStars({ rating, size = 14, className, showValue = false, count }: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className={cx('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.floor(rounded);
          const half = !filled && i + 0.5 === rounded;
          return (
            <Star
              key={i}
              size={size}
              className={cx(
                filled || half ? 'text-accent-500' : 'text-ink-300',
                filled && 'fill-accent-500',
              )}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-ink-600">
          {rating.toFixed(1)}
          {count !== undefined && <span className="text-ink-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
