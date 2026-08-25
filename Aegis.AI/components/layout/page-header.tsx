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
        'glass-panel mb-8 flex flex-col gap-4 rounded-2xl p-6 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aegis-accent-primary/20 to-aegis-accent-secondary/10 border border-white/[0.08]">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-aegis-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
