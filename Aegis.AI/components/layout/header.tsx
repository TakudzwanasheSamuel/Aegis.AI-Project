'use client';

import { useRouter } from 'next/navigation';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useLiveClock, formatTime, formatDate } from '@/hooks/use-live-clock';
import { useGatewayStatus } from '@/components/layout/gateway-status';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const now = useLiveClock();
  const router = useRouter();
  const { online, latencyMs, highSeverityAlerts } = useGatewayStatus();
  const alertCount = highSeverityAlerts.length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.05] bg-aegis-bg-primary/70 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-aegis-text-secondary hover:bg-white/[0.05] hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            className={cn(
              'hidden sm:flex items-center gap-2.5 rounded-full border px-3.5 py-1.5',
              online
                ? 'border-aegis-success/20 bg-aegis-success/10'
                : 'border-aegis-danger/20 bg-aegis-danger/10',
            )}
          >
            <span className="relative flex h-2 w-2">
              {online && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-success opacity-60" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  online ? 'bg-aegis-success' : 'bg-aegis-danger',
                )}
              />
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                online ? 'text-aegis-success' : 'text-aegis-danger',
              )}
            >
              {online ? 'System Active' : 'Gateway Unreachable'}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'hidden md:flex items-center gap-2 rounded-full border px-3.5 py-1.5',
            online
              ? 'border-white/[0.06] bg-white/[0.03]'
              : 'border-aegis-danger/20 bg-aegis-danger/10',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              online ? 'bg-aegis-success animate-pulse-glow' : 'bg-aegis-danger',
            )}
          />
          <span className="text-xs font-medium text-aegis-text-secondary">FastAPI Gateway:</span>
          <span
            className={cn(
              'text-xs font-semibold',
              online ? 'text-aegis-success' : 'text-aegis-danger',
            )}
          >
            {online ? `Online · ${latencyMs ?? '—'}ms` : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <span className="text-sm font-semibold tabular-nums text-aegis-text-primary">
              {now ? formatTime(now) : '--:--:--'}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
              {now ? formatDate(now) : 'Loading'}
            </span>
          </div>

          <div className="h-8 w-px bg-white/[0.06]" />

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-aegis-text-secondary hover:bg-white/[0.05] hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            <Moon className="h-4.5 w-4.5 hidden dark:block" />
            <Sun className="h-4.5 w-4.5 block dark:hidden" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-aegis-text-secondary hover:bg-white/[0.05] hover:text-white transition-colors"
                aria-label="High-severity alerts"
              >
                <Bell className="h-4.5 w-4.5" />
                {alertCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aegis-danger px-1 text-[9px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 border-white/[0.08] bg-aegis-surface p-0 text-aegis-text-primary"
            >
              <div className="border-b border-white/[0.06] px-3 py-2">
                <p className="text-xs font-semibold">High-severity assessments</p>
                <p className="text-[10px] text-aegis-text-muted">Latest HIGH / CRITICAL from /recent</p>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {alertCount === 0 ? (
                  <p className="px-2 py-4 text-xs text-aegis-text-muted">
                    No high-severity assessments in the latest batch.
                  </p>
                ) : (
                  highSeverityAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => router.push(`/analysis?id=${alert.id}`)}
                      className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]"
                    >
                      <span className="text-xs font-semibold text-aegis-danger">{alert.snapshot_label}</span>
                      <span className="text-[10px] text-aegis-text-muted">
                        PID {alert.pid} · {alert.risk_score}% · {alert.severity}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-1 pl-1 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aegis-accent-primary to-aegis-accent-secondary text-[9px] font-bold text-white">
              SOC
            </div>
            <div className="hidden lg:flex flex-col items-start leading-none">
              <span className="text-xs font-semibold text-aegis-text-primary">SOC Console</span>
              <span className="mt-0.5 text-[10px] text-aegis-text-muted">Examiner View</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
