import { cn } from '@/lib/utils';

interface KeyValueProps {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Numbers and identifiers: IBM Plex Mono with tabular figures. */
  mono?: boolean;
  className?: string;
  valueClassName?: string;
}

/** Muted label above, value below. */
export function KeyValue({ label, children, mono = false, className, valueClassName }: KeyValueProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs text-aegis-muted">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 break-words text-sm font-medium text-aegis-ink',
          mono && 'font-mono tabular-nums',
          valueClassName,
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** A row of KeyValue items (a description list). */
export function KeyValueList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('flex flex-wrap gap-x-8 gap-y-3', className)}>{children}</dl>;
}
