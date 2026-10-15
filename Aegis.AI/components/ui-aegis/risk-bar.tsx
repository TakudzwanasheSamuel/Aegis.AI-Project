'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { CountUp } from '@/components/motion/count-up';
import { transition } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Risk % in mono with a bar whose track carries the severity gradient,
 * clipped to the score, so the fill colour shows where the score sits on the scale.
 */
export function RiskBar({ risk, className }: { risk: number; className?: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, risk));

  return (
    <div className={cn('flex items-center justify-end gap-2.5', className)}>
      <CountUp value={risk} format={(n) => `${Math.round(n)}%`} className="text-sm text-aegis-ink" />
      <span className="relative h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-aegis-sunken" aria-hidden="true">
        <motion.span
          className="bg-grad-severity absolute inset-y-0 left-0 block"
          // The gradient spans the whole track; the element only shows the part up to the score.
          style={{ backgroundSize: pct > 0 ? `${10000 / pct}% 100%` : '100% 100%' }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : transition.slow}
        />
      </span>
    </div>
  );
}
