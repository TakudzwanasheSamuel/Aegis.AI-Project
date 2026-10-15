'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useLiveClock, formatTime, formatDate } from '@/hooks/use-live-clock';
import { useGatewayStatus } from '@/components/layout/gateway-status';
import { CountUp } from '@/components/motion/count-up';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { transition } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

const iconButton =
  'relative flex h-9 w-9 items-center justify-center rounded-md text-aegis-ink-2 transition-[color,background-color,transform] hover:bg-aegis-sunken hover:text-aegis-ink active:scale-[0.98]';

export function Header({ onMenuClick }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const now = useLiveClock();
  const router = useRouter();
  const { online, latencyMs, highSeverityAlerts } = useGatewayStatus();
  const alertCount = highSeverityAlerts.length;

  const bellControls = useAnimationControls();
  const badgeControls = useAnimationControls();
  const seenAlertIds = useRef<Set<number> | null>(null);

  useEffect(() => setMounted(true), []);

  // Shake the bell and pop the badge once when a new HIGH/CRITICAL assessment arrives.
  useEffect(() => {
    const ids = highSeverityAlerts.map((alert) => alert.id);
    if (seenAlertIds.current === null) {
      if (ids.length > 0) seenAlertIds.current = new Set(ids);
      return;
    }
    const seen = seenAlertIds.current;
    const hasNew = ids.some((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));
    if (!hasNew) return;
    bellControls.start({
      rotate: [0, -14, 12, -8, 5, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    });
    badgeControls.start({ scale: [1, 1.2, 1], transition: { duration: 0.35, ease: 'easeOut' } });
  }, [highSeverityAlerts, bellControls, badgeControls]);

  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-30 h-14 bg-aegis-paper">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className={cn(iconButton, 'lg:hidden')}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 items-center gap-2.5 text-sm sm:flex">
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                online ? 'bg-aegis-safe' : 'bg-aegis-critical',
              )}
              aria-hidden="true"
            />
            <span className="font-medium text-aegis-ink">
              {online ? 'System Active' : 'Gateway Unreachable'}
            </span>
            <span className="hidden h-4 w-px bg-aegis-rule md:block" aria-hidden="true" />
            <span className="hidden truncate text-aegis-muted md:inline">
              FastAPI Gateway:{' '}
              <span
                className={cn(
                  'font-mono tabular-nums',
                  online ? 'text-aegis-ink-2' : 'text-aegis-critical',
                )}
              >
                {online ? (
                  <>
                    Online ·{' '}
                    {latencyMs != null ? <CountUp value={latencyMs} /> : '—'}ms
                  </>
                ) : (
                  'Offline'
                )}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="font-mono text-sm tabular-nums text-aegis-ink">
              {now ? formatTime(now) : '--:--:--'}
            </span>
            <span className="text-xs text-aegis-muted">{now ? formatDate(now) : 'Loading'}</span>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-aegis-rule sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={iconButton}
            aria-label="Toggle theme"
          >
            {mounted ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={transition.fast}
                  className="flex"
                >
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            ) : (
              <>
                <Moon className="hidden h-4 w-4 dark:block" />
                <Sun className="block h-4 w-4 dark:hidden" />
              </>
            )}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={iconButton} aria-label="High-severity alerts">
                <motion.span animate={bellControls} className="flex origin-top">
                  <Bell className="h-4 w-4" />
                </motion.span>
                {alertCount > 0 && (
                  <motion.span
                    animate={badgeControls}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-aegis-critical px-1 text-xs font-medium leading-none tabular-nums text-aegis-on-accent"
                  >
                    {alertCount}
                  </motion.span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 rounded-md border-aegis-rule bg-aegis-surface p-0 text-aegis-ink shadow-md"
            >
              <div className="border-b border-aegis-rule px-4 py-3">
                <p className="text-sm font-semibold">High-severity assessments</p>
                <p className="text-xs text-aegis-muted">Latest HIGH / CRITICAL from /recent</p>
              </div>
              <div className="max-h-72 overflow-y-auto p-1.5">
                {alertCount === 0 ? (
                  <p className="px-2.5 py-4 text-sm text-aegis-muted">
                    No high-severity assessments in the latest batch.
                  </p>
                ) : (
                  highSeverityAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => router.push(`/analysis?id=${alert.id}`)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-aegis-sunken"
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          alert.severity.toUpperCase() === 'CRITICAL'
                            ? 'text-aegis-critical'
                            : 'text-aegis-high',
                        )}
                      >
                        {alert.snapshot_label}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-aegis-muted">
                        PID {alert.pid} · {alert.risk_score}% · {alert.severity}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="ml-1 flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md border border-aegis-rule bg-aegis-sunken text-xs font-semibold text-aegis-ink-2"
              aria-hidden="true"
            >
              SOC
            </span>
            <div className="hidden flex-col items-start leading-tight lg:flex">
              <span className="text-sm font-medium text-aegis-ink">SOC Console</span>
              <span className="text-xs text-aegis-muted">Examiner View</span>
            </div>
          </div>
        </div>
      </div>
      {/* Signature: the severity scale as a 2px line under the header */}
      <div className="bg-grad-severity absolute inset-x-0 bottom-0 h-0.5" aria-hidden="true" />
    </header>
  );
}
