'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { CountUp } from '@/components/motion/count-up';
import { RiskScale } from '@/components/ui-aegis/risk-scale';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { transition } from '@/lib/motion';
import { sampleSeverityGradient } from '@/lib/severity-gradient';
import { cn } from '@/lib/utils';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Ring gauge (0–100) that animates from the previous value to the new one,
 * coloured by sampling the severity gradient at the value, with the severity
 * scale and marker underneath.
 */
export function RiskGauge({
  value,
  label,
  className,
  size = 'md',
}: {
  value: number;
  /** Small caption inside the ring, e.g. "Threat Score". */
  label: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const colors = useThemeColors();
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));
  const color = sampleSeverityGradient(colors, pct / 100);
  const dashOffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative', size === 'sm' ? 'h-28 w-28' : 'h-36 w-36')}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="8" className="stroke-aegis-rule" />
          <motion.circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: dashOffset, stroke: color }}
            transition={reduce ? { duration: 0 } : transition.slow}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-medium', size === 'sm' ? 'text-2xl' : 'text-3xl')} style={{ color }}>
            <CountUp value={pct} />
          </span>
          <span className="mt-0.5 text-xs text-aegis-muted">{label}</span>
        </div>
      </div>
      <RiskScale value={pct} className="mt-3 max-w-[12rem]" />
    </div>
  );
}
