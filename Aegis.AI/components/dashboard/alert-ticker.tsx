'use client';

import Link from 'next/link';
import { BrainCircuit, CircleCheck } from 'lucide-react';

import { CountUp } from '@/components/motion/count-up';
import { Panel, SeverityBadge, buttonClasses } from '@/components/ui-aegis';
import type { AssessmentRecord } from '@/lib/api';
import { apiSeverityToUi } from '@/lib/history/map-record';

interface AlertTickerProps {
  records: AssessmentRecord[];
}

export function AlertTicker({ records }: AlertTickerProps) {
  const alerts = records.filter((record) => record.severity !== 'LOW').slice(0, 6);

  return (
    <Panel
      title="Recent Alerts"
      meta={
        <span className="text-xs">
          <CountUp value={alerts.length} /> flagged
        </span>
      }
      flush
    >
      {alerts.length === 0 ? (
        <p className="flex items-start gap-2 px-5 py-4 text-sm text-aegis-muted">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          No medium/high-severity assessments in the latest batch.
        </p>
      ) : (
        <ul className="divide-y divide-aegis-rule">
          {alerts.map((alert) => {
            const time = new Date(alert.timestamp).toLocaleTimeString();
            return (
              <li key={alert.id} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <SeverityBadge severity={alert.severity}>
                      {apiSeverityToUi(alert.severity)}
                    </SeverityBadge>
                    <span className="truncate text-sm font-medium text-aegis-ink">
                      {alert.snapshot_label}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-aegis-muted">
                    {alert.triggered_by && (
                      <>
                        <span>
                          {alert.triggered_by === 'behavioural'
                            ? 'File-Activity Monitor'
                            : 'Memory-forensic model'}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-mono tabular-nums">{time}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{alert.risk_score}% risk</span>
                  </p>
                </div>
                <Link
                  href={`/analysis?id=${alert.id}`}
                  className={buttonClasses('secondary', 'sm', 'shrink-0 px-2.5 text-xs')}
                >
                  <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
                  Analyze
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
