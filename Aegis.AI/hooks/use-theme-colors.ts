'use client';

import { useEffect, useState } from 'react';

/**
 * Resolved theme colours for libraries that need literal colour strings (Recharts).
 * Reads the CSS variables from app/globals.css and re-reads them whenever the
 * <html> class changes, which is how next-themes switches light/dark.
 */
export interface ThemeColors {
  paper: string;
  surface: string;
  sunken: string;
  ink: string;
  ink2: string;
  muted: string;
  rule: string;
  accent: string;
  onAccent: string;
  safe: string;
  moderate: string;
  high: string;
  critical: string;
  series1: string;
  series2: string;
  fontSans: string;
  fontMono: string;
}

const COLOR_VARS: Record<Exclude<keyof ThemeColors, 'fontSans' | 'fontMono'>, string> = {
  paper: '--aegis-paper',
  surface: '--aegis-surface',
  sunken: '--aegis-sunken',
  ink: '--aegis-ink',
  ink2: '--aegis-ink-2',
  muted: '--aegis-muted',
  rule: '--aegis-rule',
  accent: '--aegis-accent',
  onAccent: '--aegis-on-accent',
  safe: '--aegis-safe',
  moderate: '--aegis-moderate',
  high: '--aegis-high',
  critical: '--aegis-critical',
  series1: '--series-1',
  series2: '--series-2',
};

// Neutral placeholders for the server render and the first client paint.
const FALLBACK: ThemeColors = {
  paper: 'transparent',
  surface: 'transparent',
  sunken: 'transparent',
  ink: 'currentColor',
  ink2: 'currentColor',
  muted: 'currentColor',
  rule: 'currentColor',
  accent: 'currentColor',
  onAccent: 'currentColor',
  safe: 'currentColor',
  moderate: 'currentColor',
  high: 'currentColor',
  critical: 'currentColor',
  series1: 'currentColor',
  series2: 'currentColor',
  fontSans: 'sans-serif',
  fontMono: 'monospace',
};

function readColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const colors = { ...FALLBACK };
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    const channels = style.getPropertyValue(cssVar).trim();
    if (channels) colors[key as keyof typeof COLOR_VARS] = `rgb(${channels})`;
  }
  colors.fontSans = style.getPropertyValue('--font-sans').trim() || FALLBACK.fontSans;
  colors.fontMono = style.getPropertyValue('--font-mono').trim() || FALLBACK.fontMono;
  return colors;
}

/** `withAlpha('rgb(1 2 3)', 0.2)` → `rgb(1 2 3 / 0.2)` */
export function withAlpha(color: string, alpha: number) {
  return color.startsWith('rgb(') ? color.replace(')', ` / ${alpha})`) : color;
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    setColors(readColors());
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
