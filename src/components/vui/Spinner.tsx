import { cx } from '@/lib/utils';

export interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cx(
        'inline-block animate-spin rounded-full border-2 border-ink-200 border-t-primary-600',
        className,
      )}
    />
  );
}
