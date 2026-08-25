'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { AlertTicker } from '@/components/dashboard/alert-ticker';
import { DashboardStats } from '@/components/dashboard/stats-grid';
import { ProcessTable } from '@/components/dashboard/process-table';
import { RiskDoughnutChart } from '@/components/dashboard/risk-doughnut-chart';
import { ThreatTrendChart } from '@/components/dashboard/threat-trend-chart';
import { PageHeader } from '@/components/layout/page-header';
import {
  fetchMetrics,
  fetchRecent,
  isAgentActive,
  type AssessmentRecord,
  type MetricsResponse,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const EMPTY_METRICS: MetricsResponse = {
  total_scanned: 0,
  threats_detected: 0,
  safe_processes: 0,
  avg_risk_score: 0,
  latest_timestamp: null,
  severity_counts: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
};

export function DashboardWorkspace() {
  const [metrics, setMetrics] = useState<MetricsResponse>(EMPTY_METRICS);
  const [recent, setRecent] = useState<AssessmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextMetrics, nextRecent] = await Promise.all([fetchMetrics(), fetchRecent(20)]);
      setMetrics(nextMetrics);
      setRecent(nextRecent);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach FastAPI telemetry APIs.');
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, [load]);

  const agentConnected = isAgentActive(metrics.latest_timestamp, 15000);
  const trendPoints = useMemo(
    () =>
      [...recent]
        .reverse()
        .map((record, index) => ({
          time: String(index + 1),
          risk: record.risk_score,
        })),
    [recent],
  );

  return (
    <div>
      <PageHeader
        title="Executive Overview"
        subtitle="Real-time threat posture, system health, and active process monitoring."
        icon={<LayoutDashboard className="h-6 w-6 text-aegis-accent-secondary" />}
        actions={
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold',
              agentConnected
                ? 'border-aegis-success/30 bg-aegis-success/10 text-aegis-success'
                : 'border-aegis-warning/30 bg-aegis-warning/10 text-aegis-warning',
            )}
          >
            <span className="relative flex h-2 w-2">
              {agentConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-success opacity-60" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  agentConnected ? 'bg-aegis-success' : 'bg-aegis-warning',
                )}
              />
            </span>
            {agentConnected ? 'Agent Connected / Active Scanning' : 'Waiting for endpoint agent'}
          </div>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-aegis-danger/20 bg-aegis-danger/10 px-3 py-2 text-xs text-aegis-danger">
          {error}
        </p>
      )}

      <DashboardStats metrics={metrics} agentConnected={agentConnected} />

      <div className="mt-6 grid gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <ProcessTable records={recent} updatedAt={updatedAt} />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <ThreatTrendChart data={trendPoints} />
          <RiskDoughnutChart
            counts={metrics.severity_counts}
            total={metrics.total_scanned}
          />
          <AlertTicker records={recent} />
        </div>
      </div>
    </div>
  );
}
