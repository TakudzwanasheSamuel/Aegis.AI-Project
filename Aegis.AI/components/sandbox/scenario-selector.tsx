'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Check, Cpu, Loader2, ShieldAlert } from 'lucide-react';

import { SeverityBadge } from '@/components/ui-aegis';
import { transition } from '@/lib/motion';
import type { SandboxScenario } from '@/lib/sandbox/types';
import { cn } from '@/lib/utils';

interface ScenarioSelectorProps {
  scenarios: SandboxScenario[];
  activeScenarioId: number | null;
  loadingScenarioId: number | null;
  onLoadScenario: (scenario: SandboxScenario) => void;
}

const SCENARIO_ICONS = [Activity, Cpu, ShieldAlert];

/** The scenario data carries its badge tone as a class name; map it onto the severity scale. */
function badgeSeverity(scenario: SandboxScenario) {
  if (scenario.badgeClassName.includes('aegis-high')) return 'High';
  if (scenario.badgeClassName.includes('aegis-moderate')) return 'Moderate';
  return 'Safe';
}

/**
 * Selectable scenario cards with radio-group semantics. Arrow keys move focus
 * between cards; Enter or Space loads the focused scenario (loading POSTs it,
 * so focus alone never sends a request).
 */
export function ScenarioSelector({
  scenarios,
  activeScenarioId,
  loadingScenarioId,
  onLoadScenario,
}: ScenarioSelectorProps) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = Math.max(
    0,
    scenarios.findIndex((scenario) => scenario.id === activeScenarioId),
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in keys) {
      event.preventDefault();
      const next = (index + keys[event.key] + scenarios.length) % scenarios.length;
      cardRefs.current[next]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      cardRefs.current[event.key === 'Home' ? 0 : scenarios.length - 1]?.focus();
    }
  };

  return (
    <section>
      <div role="radiogroup" aria-label="Scenarios" className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {scenarios.map((scenario, index) => {
          const Icon = SCENARIO_ICONS[index] ?? Activity;
          const isActive = activeScenarioId === scenario.id;
          const isLoading = loadingScenarioId === scenario.id;

          return (
            <button
              key={scenario.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-busy={isLoading}
              tabIndex={index === focusIndex ? 0 : -1}
              disabled={isLoading}
              onClick={() => onLoadScenario(scenario)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'lift relative flex flex-col rounded-md border p-4 text-left transition-[transform,box-shadow,border-color] active:scale-[0.99] disabled:cursor-progress',
                isActive
                  ? 'border-transparent [background:linear-gradient(rgb(var(--aegis-surface)),rgb(var(--aegis-surface)))_padding-box,var(--grad-accent)_border-box]'
                  : 'border-aegis-rule bg-aegis-surface',
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-aegis-muted" aria-hidden="true" />
                <span className="flex items-center gap-2">
                  <SeverityBadge severity={badgeSeverity(scenario)}>{scenario.badge}</SeverityBadge>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={transition.fast}
                        className="bg-grad-accent flex h-5 w-5 items-center justify-center rounded-full text-aegis-on-accent"
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </span>

              <span className="mt-3 text-sm font-semibold text-aegis-ink">
                Scenario {scenario.id}: {scenario.title}
              </span>
              <span className="mt-1.5 flex-1 text-sm leading-relaxed text-aegis-muted">
                {scenario.subtext}
              </span>

              <span className="mt-4 flex items-center gap-1.5 text-xs font-medium text-aegis-accent">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {isLoading ? 'Sending…' : `Load Scenario ${scenario.id}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
