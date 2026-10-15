'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { AlertTicker } from '@/components/dashboard/alert-ticker';
import { DashboardStats } from '@/components/dashboard/stats-grid';
import { LiveTelemetry } from '@/components/dashboard/live-telemetry';
import { PageHeader } from '@/components/layout/page-header';
import { Notice, StatusDot } from '@/components/ui-aegis';
import {
  fetchMetrics,
  fetchRecent,
  isAgentActive,
  type AssessmentRecord,
  type MetricsResponse,
} from '@/lib/api';

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

  return (
    <div>
      <PageHeader
        title="Executive Overview"
        subtitle="Real-time threat posture, system health, and active process monitoring."
        icon={<LayoutDashboard />}
        actions={
          <div className="inline-flex items-center gap-2 rounded-md border border-aegis-rule bg-aegis-surface px-3 py-1.5 text-sm text-aegis-ink-2">
            <StatusDot tone={agentConnected ? 'safe' : 'moderate'} />
            {agentConnected ? 'Agent Connected / Active Scanning' : 'Waiting for endpoint agent'}
          </div>
        }
      />

      {error && <Notice className="mb-6">{error}</Notice>}

      <DashboardStats latest={recent[0] ?? null} />

      <div className="mt-6 grid gap-6 lg:grid-cols-10">
        <div className="min-w-0 lg:col-span-7">
          <LiveTelemetry records={recent} updatedAt={updatedAt} agentConnected={agentConnected} />
        </div>
        <div className="min-w-0 lg:col-span-3">
          <AlertTicker records={recent} />
        </div>
      </div>
    </div>
  );
}
