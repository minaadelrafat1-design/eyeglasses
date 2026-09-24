import type { ReactNode } from 'react';
import { Badge } from '@/components/vui';

export interface PagePlaceholderProps {
  title: string;
  description: string;
  badge?: string;
  children?: ReactNode;
}

/**
 * Placeholder page used for routes whose full UI ships in a later phase.
 * Renders a clean, branded "coming soon" state — not demo content.
 */
export function PagePlaceholder({ title, description, badge, children }: PagePlaceholderProps) {
  return (
    <div className="container-app py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        {badge && (
          <Badge variant="primary" className="mb-4">
            {badge}
          </Badge>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg text-ink-500 text-pretty">{description}</p>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </div>
  );
}
