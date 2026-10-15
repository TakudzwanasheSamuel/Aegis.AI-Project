import { SEVERITY_CLASSES, type SeverityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

/** Static 8px status dot. Decorative: pair it with visible text. */
export function StatusDot({ tone, className }: { tone: SeverityLevel; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', SEVERITY_CLASSES[tone].bg, className)}
    />
  );
}
