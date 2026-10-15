import { cn } from '@/lib/utils';

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right side of the header row: muted meta text, filters, actions. */
  meta?: React.ReactNode;
  /** Left accent rule, e.g. a severity colour: 'border-l-aegis-safe'. */
  accentClassName?: string;
  /** Drop body padding (tables and lists that run edge to edge). */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  as?: 'section' | 'div';
}

/** Surface + 1px rule border; optional header row separated by a hairline. */
export function Panel({
  title,
  description,
  meta,
  accentClassName,
  flush = false,
  className,
  bodyClassName,
  children,
  as: Tag = 'section',
}: PanelProps) {
  const hasHeader = title != null || meta != null;

  return (
    <Tag
      className={cn(
        'min-w-0 overflow-hidden rounded-lg border border-aegis-rule bg-aegis-surface',
        accentClassName && cn('border-l-4', accentClassName),
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-aegis-rule px-5 py-3.5">
          <div className="min-w-0">
            {title != null && <PanelTitle>{title}</PanelTitle>}
            {description != null && (
              <p className="mt-0.5 text-sm text-aegis-muted">{description}</p>
            )}
          </div>
          {meta != null && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-aegis-muted">{meta}</div>
          )}
        </header>
      )}
      {children != null && <div className={cn(!flush && 'p-5', bodyClassName)}>{children}</div>}
    </Tag>
  );
}

/** Panel titles are sans (serif is reserved for page titles). */
export function PanelTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'font-sans text-[0.9375rem] font-semibold leading-6 tracking-normal text-aegis-ink',
        className,
      )}
    >
      {children}
    </h2>
  );
}
