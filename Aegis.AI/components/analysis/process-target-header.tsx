'use client';

import { Clock, Monitor, ShieldAlert, ShieldCheck } from 'lucide-react';

import type { AssessmentRecord } from '@/lib/api';
import { apiSeverityToUi } from '@/lib/history/map-record';
import { cn } from '@/lib/utils';

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ProcessTargetHeader({ record }: { record: AssessmentRecord }) {
  const uiSeverity = apiSeverityToUi(record.severity);
  const isThreat = uiSeverity === 'High' || uiSeverity === 'Critical';
  const confidencePct = Math.round(record.confidence * 1000) / 10;

  const info = [
    { icon: Clock, label: 'Assessed', value: formatStamp(record.timestamp) },
    { icon: Monitor, label: 'Hostname', value: record.hostname },
  ];
  const detector =
    record.triggered_by === 'behavioural'
      ? 'Detected by: Behavioural file-activity monitor'
      : 'Detected by: Memory-forensic model';

  return (
    <div className="surface-card rounded-card overflow-hidden">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl border',
              isThreat
                ? 'border-aegis-danger/20 bg-aegis-danger/10'
                : 'border-aegis-success/20 bg-aegis-success/10',
            )}
          >
            {isThreat ? (
              <ShieldAlert className="h-7 w-7 text-aegis-danger" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-aegis-success" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-aegis-text-primary">{record.snapshot_label}</h2>
            <p className="mt-1 text-xs text-aegis-text-muted">
              Assessment #{record.id} · {record.prediction}
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-aegis-text-muted" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-aegis-text-muted">{item.label}</p>
                  <p className="truncate text-xs font-medium text-aegis-text-secondary">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex flex-col items-center gap-1 rounded-card border px-6 py-4"
            style={{
              borderColor: isThreat ? 'rgba(220, 38, 38, 0.4)' : 'rgba(16, 185, 129, 0.35)',
              backgroundColor: isThreat ? 'rgba(220, 38, 38, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            }}
          >
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                isThreat ? 'text-aegis-critical' : 'text-aegis-success',
              )}
            >
              [{uiSeverity === 'Safe' ? 'SAFE' : `${uiSeverity.toUpperCase()} THREAT`}]
            </span>
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                isThreat ? 'text-aegis-danger' : 'text-aegis-success',
              )}
            >
              {record.risk_score}%
            </span>
            <span className="text-[10px] font-medium text-aegis-text-muted">
              Risk score · {confidencePct}% confidence
            </span>
          </div>
          <p className="max-w-[220px] text-center text-xs font-medium text-aegis-text-secondary">
            {detector}
          </p>
        </div>
      </div>
    </div>
  );
}
