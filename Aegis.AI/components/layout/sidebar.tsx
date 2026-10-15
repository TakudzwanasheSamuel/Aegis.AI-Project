'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { BrandMark, Wordmark } from '@/components/layout/brand-mark';
import { useGatewayStatus } from '@/components/layout/gateway-status';
import { CountUp } from '@/components/motion/count-up';
import { navRoutes } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { online, metrics } = useGatewayStatus();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-aegis-scrim/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col border-r border-aegis-rule bg-aegis-surface transition-transform duration-200 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-aegis-rule px-5">
          <Link href="/" className="flex items-center gap-2.5 rounded-sm">
            <BrandMark className="h-7 w-7" />
            <span className="flex flex-col">
              <Wordmark />
              <span className="text-xs leading-tight text-aegis-muted">Threat Analytics</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-aegis-muted transition-colors hover:bg-aegis-sunken hover:text-aegis-ink lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navigation">
          <p className="mb-2 px-3 text-xs font-medium text-aegis-muted">Navigation</p>
          <ul className="space-y-0.5">
            {navRoutes.map((route) => {
              const isActive =
                route.href === '/' ? pathname === '/' : pathname.startsWith(route.href);
              const Icon = route.icon;

              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-r-md px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-aegis-sunken text-aegis-ink'
                        : 'text-aegis-ink-2 hover:bg-aegis-sunken/60 hover:text-aegis-ink',
                    )}
                  >
                    {/* The active bar slides between items (shared layoutId). */}
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="bg-grad-accent absolute inset-y-1 left-0 w-0.5 rounded-full"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
                        isActive ? 'text-aegis-ink' : 'text-aegis-muted',
                      )}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className={cn('text-sm leading-5', isActive ? 'font-semibold' : 'font-medium')}>
                        {route.label}
                      </span>
                      <span className="text-xs leading-4 text-aegis-muted">{route.description}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-aegis-rule px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                online ? 'bg-aegis-safe' : 'bg-aegis-critical',
              )}
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-aegis-ink-2">
              {online ? 'AI Engine Online' : 'AI Engine Offline'}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-aegis-muted">
            8-feature RF + XGBoost ensemble ·{' '}
            <CountUp value={metrics.threats_detected} className="text-aegis-ink-2" />{' '}
            high-severity assessments stored
          </p>
        </div>
      </aside>
    </>
  );
}
