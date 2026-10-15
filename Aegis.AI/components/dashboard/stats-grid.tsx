'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Panel } from '@/components/ui-aegis';
import type { AssessmentRecord } from '@/lib/api';
import { SEVERITY_CLASSES } from '@/lib/severity';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  latest: AssessmentRecord | null;
}

export function DashboardStats({ latest }: DashboardStatsProps) {
  const severity = latest?.severity.toUpperCase() ?? '';
  const threat = severity === 'HIGH' || severity === 'CRITICAL';
  const tone = SEVERITY_CLASSES[threat ? 'critical' : 'safe'];
  const Icon = threat ? ShieldAlert : ShieldCheck;

  return (
    <Panel as="div" accentClassName={tone.leftRule} className="surface-glow" bodyClassName="px-6 py-5">
      <p className="flex items-center gap-2 text-sm font-medium text-aegis-muted">
        <Icon className={cn('h-4 w-4', tone.text)} aria-hidden="true" />
        Endpoint status
      </p>
      <p className={cn('mt-1 font-serif text-[2rem] font-semibold leading-tight', tone.text)}>
        {threat ? 'Threat detected' : 'Safe'}
      </p>
      <p className="mt-1 text-sm text-aegis-ink-2">
        {threat
          ? `${latest?.snapshot_label ?? 'Latest snapshot'} is flagged in Live Telemetry.`
          : latest
            ? 'The latest snapshot in Live Telemetry is safe.'
            : 'No assessment yet.'}
      </p>
    </Panel>
  );
}
