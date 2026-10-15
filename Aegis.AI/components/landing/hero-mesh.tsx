'use client';

import { motion, useReducedMotion } from 'framer-motion';

const BLOBS = [
  {
    className: 'left-[-10%] top-[-20%] h-[28rem] w-[28rem] bg-aegis-accent',
    x: [0, 60, -20, 0],
    y: [0, 40, 70, 0],
  },
  {
    className: 'right-[-5%] top-[10%] h-[24rem] w-[24rem] bg-aegis-teal',
    x: [0, -50, 20, 0],
    y: [0, 50, -30, 0],
  },
  {
    className: 'bottom-[-30%] left-[30%] h-[22rem] w-[22rem] bg-aegis-accent',
    x: [0, 40, -40, 0],
    y: [0, -40, 10, 0],
  },
];

/**
 * Slow-drifting gradient mesh behind the landing hero: three blurred blobs in
 * accent/teal at low opacity on top of the surface glow. Static under reduced motion.
 */
export function HeroMesh() {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="surface-glow pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]"
    >
      {BLOBS.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full opacity-[0.14] blur-3xl dark:opacity-[0.2] ${blob.className}`}
          animate={reduce ? undefined : { x: blob.x, y: blob.y }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: index * 2 }}
        />
      ))}
    </div>
  );
}
