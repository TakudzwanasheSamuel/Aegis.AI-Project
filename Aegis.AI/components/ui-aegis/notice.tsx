import { SEVERITY_CLASSES, type SeverityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

/** Plain bordered notice with a 4px severity rule on the left (errors, warnings). */
export function Notice({
  tone = 'critical',
  children,
  className,
}: {
  /** A severity level, or 'info' for a neutral accent-ruled note. */
  tone?: SeverityLevel | 'info';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'critical' || tone === 'high' ? 'alert' : tone === 'info' ? undefined : 'status'}
      className={cn(
        'rounded-md border border-l-4 border-aegis-rule bg-aegis-surface px-4 py-3 text-sm text-aegis-ink',
        tone === 'info' ? 'border-l-aegis-accent bg-aegis-sunken/60 text-aegis-ink-2' : SEVERITY_CLASSES[tone].leftRule,
        className,
      )}
    >
      {children}
    </div>
  );
}
