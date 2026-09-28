'use client';

import Link from 'next/link';
import { AlertTriangle, BrainCircuit, Clock } from 'lucide-react';

import type { AssessmentRecord } from '@/lib/api';

interface AlertTickerProps {
  records: AssessmentRecord[];
}

export function AlertTicker({ records }: AlertTickerProps) {
  const alerts = records.filter((record) => record.severity !== 'LOW').slice(0, 6);

  return (
    <div className="surface-card rounded-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-aegis-warning" />
          <h3 className="text-sm font-semibold text-aegis-text-primary">Recent Alerts</h3>
        </div>
        <span className="rounded-full bg-aegis-warning/10 px-2 py-0.5 text-[10px] font-semibold text-aegis-warning">
          {alerts.length} flagged
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {alerts.length === 0 ? (
          <p className="text-xs text-aegis-text-muted">No medium/high-severity assessments in the latest batch.</p>
        ) : (
          alerts.map((alert) => {
            const isHigh = alert.severity === 'HIGH' || alert.severity === 'CRITICAL';
            const time = new Date(alert.timestamp).toLocaleTimeString();
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:bg-white/[0.04] ${
                  isHigh
                    ? 'border-aegis-danger/20 bg-aegis-danger/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isHigh ? 'bg-aegis-danger' : 'bg-aegis-warning'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-xs font-semibold ${isHigh ? 'text-aegis-danger' : 'text-aegis-text-primary'}`}>
                      {alert.snapshot_label}
                    </span>
                    {alert.triggered_by && (
                      <span className="shrink-0 text-[10px] font-medium text-aegis-text-muted">
                        {alert.triggered_by === 'behavioural'
                          ? 'Behavioural file-activity detector'
                          : 'Memory-forensic model'}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-aegis-text-muted" />
                    <span className="text-[10px] tabular-nums text-aegis-text-muted">{time}</span>
                    <span className="text-[10px] text-aegis-text-muted">·</span>
                    <span className={`text-[10px] font-medium ${isHigh ? 'text-aegis-danger' : 'text-aegis-warning'}`}>
                      {alert.risk_score}% risk
                    </span>
                  </div>
                </div>
                <Link
                  href={`/analysis?id=${alert.id}`}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-aegis-accent-primary/20 bg-aegis-accent-primary/10 px-2.5 py-1.5 text-[10px] font-semibold text-aegis-accent-primary transition-all duration-300 hover:bg-aegis-accent-primary/20"
                >
                  <BrainCircuit className="h-3 w-3" />
                  Analyze
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
