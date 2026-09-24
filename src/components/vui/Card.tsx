import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
  interactive?: boolean;
}

export function Card({ children, className, as: Tag = 'div', interactive = false }: CardProps) {
  return (
    <Tag
      className={cx(
        'surface-card overflow-hidden',
        interactive &&
          'transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-pop)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
