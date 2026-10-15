'use client';

import { useRef } from 'react';

/**
 * Ruled capabilities grid with a soft accent spotlight that follows the cursor
 * (6% accent radial). Pointer position is written to CSS variables, so moving
 * the mouse never re-renders React.
 */
export function CapabilityGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} className="group/spot relative">
      <ul className="grid gap-px border border-aegis-rule bg-aegis-rule sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </ul>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(var(--aegis-accent) / 0.06), transparent 70%)',
        }}
      />
    </div>
  );
}
