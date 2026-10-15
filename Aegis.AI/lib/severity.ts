/**
 * One place that turns any severity wording used in the app into a colour level.
 * Accepts API values (LOW / MEDIUM / HIGH / CRITICAL) and UI labels
 * ('Safe', 'Moderate', 'Warning', 'High', 'High Risk', 'Critical', …).
 */
export type SeverityLevel = 'safe' | 'moderate' | 'high' | 'critical';

const LEVEL_BY_KEY: Record<string, SeverityLevel> = {
  LOW: 'safe',
  SAFE: 'safe',
  BENIGN: 'safe',
  MEDIUM: 'moderate',
  MODERATE: 'moderate',
  WARNING: 'moderate',
  ELEVATED: 'moderate',
  HIGH: 'high',
  'HIGH RISK': 'high',
  CRITICAL: 'critical',
};

export function severityLevel(value: string | null | undefined): SeverityLevel {
  if (!value) return 'safe';
  return LEVEL_BY_KEY[value.trim().toUpperCase()] ?? 'safe';
}

export function isThreatLevel(level: SeverityLevel) {
  return level === 'high' || level === 'critical';
}

/** Risk-score bands used by the risk bars (≥70 high, ≥25 moderate). */
export function riskLevel(risk: number): SeverityLevel {
  if (risk >= 70) return 'high';
  if (risk >= 25) return 'moderate';
  return 'safe';
}

/** Static class names per level so Tailwind can see them at build time. */
export const SEVERITY_CLASSES: Record<
  SeverityLevel,
  {
    text: string;
    strongText: string;
    bg: string;
    tint: string;
    border: string;
    leftRule: string;
    fill: string;
  }
> = {
  safe: {
    text: 'text-aegis-safe',
    strongText: 'text-aegis-safe-strong',
    bg: 'bg-aegis-safe',
    tint: 'bg-aegis-safe/[0.12]',
    border: 'border-aegis-safe',
    leftRule: 'border-l-aegis-safe',
    fill: 'fill-aegis-safe',
  },
  moderate: {
    text: 'text-aegis-moderate',
    strongText: 'text-aegis-moderate-strong',
    bg: 'bg-aegis-moderate',
    tint: 'bg-aegis-moderate/[0.12]',
    border: 'border-aegis-moderate',
    leftRule: 'border-l-aegis-moderate',
    fill: 'fill-aegis-moderate',
  },
  high: {
    text: 'text-aegis-high',
    strongText: 'text-aegis-high-strong',
    bg: 'bg-aegis-high',
    tint: 'bg-aegis-high/[0.12]',
    border: 'border-aegis-high',
    leftRule: 'border-l-aegis-high',
    fill: 'fill-aegis-high',
  },
  critical: {
    text: 'text-aegis-critical',
    strongText: 'text-aegis-critical-strong',
    bg: 'bg-aegis-critical',
    tint: 'bg-aegis-critical/[0.12]',
    border: 'border-aegis-critical',
    leftRule: 'border-l-aegis-critical',
    fill: 'fill-aegis-critical',
  },
};
