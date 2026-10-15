import type { Transition, Variants } from 'framer-motion';

/** Shared motion language. Reduced motion is handled by <MotionConfig reducedMotion="user"> in AppShell. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.6,
} as const;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE } satisfies Transition,
  base: { duration: DURATION.base, ease: EASE } satisfies Transition,
  slow: { duration: DURATION.slow, ease: EASE } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: transition.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: transition.base },
};

export function stagger(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}
