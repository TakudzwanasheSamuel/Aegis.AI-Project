import { cn } from '@/lib/utils';

/** Shimmer placeholder on the sunken colour (static under reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block rounded-sm', className)} />;
}
