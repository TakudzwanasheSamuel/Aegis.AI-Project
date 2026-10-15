'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { transition } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** The platform's severity scale (safe → critical) with a marker at the current risk. */
export function RiskScale({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('relative h-1.5 w-full', className)} aria-hidden="true">
      <div className="bg-grad-severity h-full w-full rounded-full" />
      <motion.span
        className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-aegis-surface bg-aegis-ink"
        initial={false}
        animate={{ left: `${pct}%` }}
        transition={reduce ? { duration: 0 } : transition.slow}
      />
    </div>
  );
}
