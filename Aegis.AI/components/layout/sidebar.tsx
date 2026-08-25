'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';

import { useGatewayStatus } from '@/components/layout/gateway-status';
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-aegis-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-aegis-accent-primary to-aegis-accent-secondary shadow-glow-primary transition-transform group-hover:scale-105">
              <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gradient leading-none">
                AegisAI
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-aegis-text-muted">
                Threat Analytics
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-aegis-text-muted hover:text-aegis-text-primary transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 h-px bg-white/[0.06]" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-aegis-text-muted">
            Navigation
          </p>
          {navRoutes.map((route) => {
            const isActive =
              route.href === '/' ? pathname === '/' : pathname.startsWith(route.href);
            const Icon = route.icon;

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-aegis-text-secondary hover:text-white hover:bg-white/[0.05]',
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-aegis-accent-primary/20 to-aegis-accent-secondary/10 border border-white/[0.08]" />
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-aegis-accent-primary to-aegis-accent-secondary" />
                )}
                <Icon
                  className={cn(
                    'relative h-5 w-5 shrink-0 transition-colors',
                    isActive
                      ? 'text-aegis-accent-secondary'
                      : 'text-aegis-text-muted group-hover:text-aegis-accent-secondary',
                  )}
                  strokeWidth={2}
                />
                <span className="relative flex flex-col">
                  <span className={cn(isActive && 'text-gradient font-semibold')}>{route.label}</span>
                  <span className="text-[10px] font-normal text-aegis-text-muted leading-tight">
                    {route.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {online && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-success opacity-60" />
                )}
                <span
                  className={cn(
                    'relative inline-flex h-2.5 w-2.5 rounded-full',
                    online ? 'bg-aegis-success' : 'bg-aegis-danger',
                  )}
                />
              </span>
              <span className="text-xs font-medium text-aegis-text-secondary">
                {online ? 'AI Engine Online' : 'AI Engine Offline'}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-aegis-text-muted">
              8-feature RF + XGBoost ensemble ·{' '}
              <span className="tabular-nums text-aegis-text-secondary">
                {metrics.threats_detected.toLocaleString()}
              </span>{' '}
              high-severity assessments stored
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
