'use client';

import { motion } from 'framer-motion';

import { fadeUp, stagger } from '@/lib/motion';

interface MotionWrapperProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'aria-label'?: string;
}

const REVEAL_TAGS = {
  section: motion.section,
  div: motion.div,
  footer: motion.footer,
} as const;

/** Reveals once as it enters the viewport (20% visible). */
export function Reveal({
  as = 'section',
  children,
  ...props
}: MotionWrapperProps & { as?: keyof typeof REVEAL_TAGS }) {
  const Tag = REVEAL_TAGS[as];
  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Orchestrates a one-time staggered entrance of its <StaggerItem> children on load. */
export function StaggerGroup({
  as = 'div',
  children,
  gap = 0.08,
  delay = 0.05,
  ...props
}: MotionWrapperProps & { as?: 'section' | 'div'; gap?: number; delay?: number }) {
  const Tag = as === 'section' ? motion.section : motion.div;
  return (
    <Tag initial="hidden" animate="show" variants={stagger(gap, delay)} {...props}>
      {children}
    </Tag>
  );
}

const ITEM_TAGS = {
  div: motion.div,
  p: motion.p,
  h1: motion.h1,
  ul: motion.ul,
} as const;

export function StaggerItem({
  as = 'div',
  children,
  ...props
}: MotionWrapperProps & { as?: keyof typeof ITEM_TAGS }) {
  const Tag = ITEM_TAGS[as];
  return (
    <Tag variants={fadeUp} {...props}>
      {children}
    </Tag>
  );
}
