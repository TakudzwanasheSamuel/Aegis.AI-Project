import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 border-b border-aegis-rule pb-6 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          // Child selectors override the colour/size classes callers pass on the icon.
          <div
            className="mt-1.5 shrink-0 text-aegis-muted [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-aegis-muted"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-title font-semibold text-aegis-ink">{title}</h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-sm text-aegis-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
