'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

interface CountUpProps {
  value: number;
  /** Formats the in-between and final value, e.g. (n) => `${n.toFixed(2)}%`. */
  format?: (value: number) => string;
  /** Start value for the first animation (on first view). */
  from?: number;
  className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString();

/**
 * Spring-animated number in IBM Plex Mono. Counts from `from` the first time
 * it scrolls into view, then springs from the previous value on each change.
 * Screen readers get the final value only.
 */
export function CountUp({ value, format = defaultFormat, from = 0, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const motionValue = useMotionValue(from);
  const spring = useSpring(motionValue, { stiffness: 110, damping: 22, mass: 0.7 });
  const display = useTransform(spring, (latest) => format(latest));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      motionValue.jump(value);
      spring.jump(value);
    } else {
      motionValue.set(value);
    }
  }, [value, inView, reduce, motionValue, spring]);

  return (
    <span ref={ref} className={cn('font-mono tabular-nums', className)}>
      <span className="sr-only">{format(value)}</span>
      <motion.span aria-hidden="true">{display}</motion.span>
    </span>
  );
}
