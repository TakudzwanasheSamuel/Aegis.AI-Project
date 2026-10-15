import { SEVERITY_CLASSES, severityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  /** Any severity wording: LOW/MEDIUM/HIGH/CRITICAL, 'Safe', 'Warning', 'High Risk', … */
  severity: string | null | undefined;
  /** Visible text; defaults to the severity value itself. */
  children?: React.ReactNode;
  className?: string;
}

/** Small rectangular label: 12% tint of the severity colour, text in the colour. */
export function SeverityBadge({ severity, children, className }: SeverityBadgeProps) {
  const tone = SEVERITY_CLASSES[severityLevel(severity)];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-semibold leading-4',
        tone.tint,
        tone.strongText,
        className,
      )}
    >
      {children ?? severity}
    </span>
  );
}
