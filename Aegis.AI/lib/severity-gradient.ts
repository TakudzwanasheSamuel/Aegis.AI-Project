import type { ThemeColors } from '@/hooks/use-theme-colors';

type RGB = [number, number, number];

function parse(color: string): RGB | null {
  const match = color.match(/rgb\((\d+)\s+(\d+)\s+(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/**
 * The colour of --grad-severity at position t (0–1): the same four evenly
 * spaced stops (safe → moderate → high → critical) as the CSS gradient.
 */
export function sampleSeverityGradient(colors: ThemeColors, t: number): string {
  const stops = [colors.safe, colors.moderate, colors.high, colors.critical].map(parse);
  if (stops.some((stop) => stop === null)) {
    return t >= 0.8 ? colors.critical : t >= 0.6 ? colors.high : t >= 0.3 ? colors.moderate : colors.safe;
  }
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const [a, b] = [stops[index] as RGB, stops[index + 1] as RGB];
  const mix = a.map((channel, i) => Math.round(channel + (b[i] - channel) * local));
  return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
}
