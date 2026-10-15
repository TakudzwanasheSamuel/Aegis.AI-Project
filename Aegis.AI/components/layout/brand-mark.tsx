'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';

/** Shield mark filled with the accent gradient, with a light inner check. */
export function BrandMark({ className }: { className?: string }) {
  const gradientId = `brand-grad-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 24 24" className={cn('h-6 w-6 shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'rgb(var(--aegis-accent))' }} />
          <stop offset="100%" style={{ stopColor: 'rgb(var(--aegis-teal))' }} />
        </linearGradient>
      </defs>
      <path
        d="M12 2.25 4.5 5.1v6.06c0 4.6 3.13 8.9 7.5 10.09 4.37-1.19 7.5-5.49 7.5-10.09V5.1L12 2.25Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="m8.75 12.1 2.25 2.25 4.25-4.6"
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'rgb(var(--aegis-on-accent))' }}
      />
    </svg>
  );
}

/** "AegisAI" in the serif face with the accent gradient (wordmark only). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-grad-accent font-serif text-lg font-semibold leading-tight', className)}>
      AegisAI
    </span>
  );
}
