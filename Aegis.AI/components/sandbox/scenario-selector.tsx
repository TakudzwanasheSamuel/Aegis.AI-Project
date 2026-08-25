'use client';

import { Activity, Cpu, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SandboxScenario } from '@/lib/sandbox/types';
import { cn } from '@/lib/utils';

interface ScenarioSelectorProps {
  scenarios: SandboxScenario[];
  activeScenarioId: number | null;
  loadingScenarioId: number | null;
  onLoadScenario: (scenario: SandboxScenario) => void;
}

const SCENARIO_ICONS = [Activity, Cpu, ShieldAlert];

export function ScenarioSelector({
  scenarios,
  activeScenarioId,
  loadingScenarioId,
  onLoadScenario,
}: ScenarioSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scenarios.map((scenario, index) => {
        const Icon = SCENARIO_ICONS[index] ?? Activity;
        const isActive = activeScenarioId === scenario.id;
        const isLoading = loadingScenarioId === scenario.id;

        return (
          <div
            key={scenario.id}
            className={cn(
              'surface-card rounded-card flex flex-col p-5 transition-all duration-300',
              isActive && 'ring-1 ring-aegis-accent-primary/40 shadow-glow-primary',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Icon className="h-5 w-5 text-aegis-accent-secondary" />
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                  scenario.badgeClassName,
                )}
              >
                {scenario.badge}
              </span>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-aegis-text-primary">
              Scenario {scenario.id}: {scenario.title}
            </h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-aegis-text-muted">
              {scenario.subtext}
            </p>

            <Button
              className={cn(
                'mt-5 w-full text-xs font-semibold',
                isActive
                  ? 'btn-gradient text-white'
                  : 'border border-white/[0.08] bg-white/[0.03] text-aegis-text-secondary hover:bg-white/[0.06]',
              )}
              variant={isActive ? 'default' : 'outline'}
              disabled={isLoading}
              onClick={() => onLoadScenario(scenario)}
            >
              {isLoading ? 'Sending to Gateway…' : `Load Scenario ${scenario.id}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
