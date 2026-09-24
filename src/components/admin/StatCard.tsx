import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendVariant?: 'positive' | 'negative' | 'neutral';
  accent?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-secondary-50 text-secondary-600',
  accent: 'bg-accent-50 text-accent-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
};

const trendClasses = {
  positive: 'text-success-600',
  negative: 'text-error-600',
  neutral: 'text-ink-500',
};

export function StatCard({ label, value, icon, trend, trendVariant = 'neutral', accent = 'primary' }: StatCardProps) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between">
        <div className={cx('flex h-12 w-12 items-center justify-center rounded-xl', accentClasses[accent])}>
          {icon}
        </div>
        {trend && (
          <span className={cx('text-sm font-medium', trendClasses[trendVariant])}>{trend}</span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
