'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';

import type { AssessmentRecord } from '@/lib/api';

interface DashboardStatsProps {
  latest: AssessmentRecord | null;
}

export function DashboardStats({ latest }: DashboardStatsProps) {
  const severity = latest?.severity.toUpperCase() ?? '';
  const threat = severity === 'HIGH' || severity === 'CRITICAL';

  return (
    <div
      className={`surface-card rounded-card p-8 ${
        threat
          ? 'border-aegis-danger/30 shadow-glow-danger'
          : 'border-aegis-success/30 shadow-glow-success'
      }`}
    >
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
            threat
              ? 'border-aegis-danger/20 bg-aegis-danger/10'
              : 'border-aegis-success/20 bg-aegis-success/10'
          }`}
        >
          {threat ? (
            <ShieldAlert className="h-8 w-8 text-aegis-danger" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-aegis-success" />
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-aegis-text-muted">Endpoint status</p>
          <p
            className={`mt-1 text-3xl font-bold ${
              threat ? 'text-aegis-danger' : 'text-aegis-success'
            }`}
          >
            {threat ? 'Threat detected' : 'Safe'}
          </p>
          <p className="mt-1 text-sm text-aegis-text-secondary">
            {threat
              ? `${latest?.snapshot_label ?? 'Latest snapshot'} is flagged in Live Telemetry.`
              : latest
                ? 'The latest snapshot in Live Telemetry is safe.'
                : 'No assessment yet.'}
          </p>
        </div>
      </div>
    </div>
  );
}
