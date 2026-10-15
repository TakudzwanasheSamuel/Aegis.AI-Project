import { cn } from '@/lib/utils';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,background-position,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary: 'btn-grad',
  secondary: 'border border-aegis-muted/50 bg-aegis-surface text-aegis-ink hover:bg-aegis-sunken',
  ghost: 'text-aegis-ink-2 hover:bg-aegis-sunken hover:text-aegis-ink',
} as const;

const sizes = {
  sm: 'h-8 px-3',
  md: 'h-9 px-4',
} as const;

/** Class names for links and buttons that should look like buttons. */
export function buttonClasses(
  variant: keyof typeof variants = 'secondary',
  size: keyof typeof sizes = 'md',
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}
