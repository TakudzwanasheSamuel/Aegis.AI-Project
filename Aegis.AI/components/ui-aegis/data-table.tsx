import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Data-table building blocks: sunken header row, hairline dividers, 44px rows,
 * sunken hover, no zebra stripes. The wrapper scrolls horizontally inside its
 * container so a wide table never scrolls the page.
 */
export function DataTable({
  children,
  className,
  minWidth,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  /** e.g. 'min-w-[640px]' so narrow screens scroll inside the panel. */
  minWidth?: string;
  label?: string;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label={label} className={cn('w-full border-collapse text-sm', minWidth, className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-aegis-rule bg-aegis-sunken">
      {children}
    </thead>
  );
}

export function Th({
  children,
  align = 'left',
  className,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'h-9 whitespace-nowrap px-4 text-xs font-medium text-aegis-muted',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export const Tr = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }
>(function Tr({ className, interactive = false, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-aegis-rule last:border-b-0 transition-colors hover:bg-aegis-sunken',
        interactive && 'lift cursor-pointer',
        className,
      )}
      {...props}
    />
  );
});

export function Td({
  children,
  align = 'left',
  numeric = false,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Right-aligned mono with tabular figures. */
  numeric?: boolean;
  className?: string;
  colSpan?: number;
}) {
  const alignment = numeric ? 'right' : align;
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'h-11 px-4 py-2 align-middle text-aegis-ink',
        alignment === 'right' ? 'text-right' : alignment === 'center' ? 'text-center' : 'text-left',
        numeric && 'font-mono tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  );
}
