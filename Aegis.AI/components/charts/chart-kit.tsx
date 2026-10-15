'use client';

import type { CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion';
import { useThemeColors, withAlpha } from '@/hooks/use-theme-colors';
import { cn } from '@/lib/utils';

/**
 * Shared Recharts styling so every chart reads as one system:
 * horizontal dashed rule-colour gridlines, rule-colour axis lines, 12px muted
 * ticks (mono for numbers), a flat surface tooltip, and no animation when the
 * OS asks for reduced motion.
 */
export function useChartKit() {
  const colors = useThemeColors();
  const reducedMotion = usePrefersReducedMotion();

  const tick = { fontSize: 12, fill: colors.muted, fontFamily: colors.fontSans };
  const numericTick = { ...tick, fontFamily: colors.fontMono };

  const tooltip = {
    cursor: { fill: withAlpha(colors.sunken, 0.8) },
    contentStyle: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.rule}`,
      borderRadius: 6,
      boxShadow: 'none',
      padding: '6px 10px',
      fontSize: 12,
      fontFamily: colors.fontSans,
      color: colors.ink,
    } satisfies CSSProperties,
    labelStyle: { color: colors.muted, marginBottom: 2 } satisfies CSSProperties,
    itemStyle: { color: colors.ink, fontFamily: colors.fontMono, padding: 0 } satisfies CSSProperties,
  };

  return {
    colors,
    animate: !reducedMotion,
    /** Recharts animation length (ms). */
    duration: 600,
    grid: { stroke: colors.rule, strokeDasharray: '3 3', vertical: false },
    axisLine: { stroke: colors.rule },
    tick,
    numericTick,
    tooltip,
  };
}

/** Width a category axis needs for mono labels at 12px (~7.2px per character). */
export function monoLabelWidth(labels: string[], max = 240) {
  const longest = labels.reduce((n, label) => Math.max(n, label.length), 0);
  return Math.min(max, Math.ceil(longest * 7.2) + 12);
}

export interface LegendItem {
  label: React.ReactNode;
  /** Static Tailwind background class for the swatch, e.g. 'bg-series-1'. */
  swatchClassName: string;
  shape?: 'square' | 'line';
}

/** Small muted legend for a Panel header (top-right), never inside the plot. */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-aegis-muted', className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0',
              item.shape === 'line' ? 'h-0.5 w-4' : 'h-2.5 w-2.5',
              item.swatchClassName,
            )}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Figure caption under a chart: muted 12px. */
export function ChartCaption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-3 text-xs leading-relaxed text-aegis-muted">{children}</figcaption>;
}
