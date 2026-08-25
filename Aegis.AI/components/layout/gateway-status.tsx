'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  fetchMetrics,
  fetchRecent,
  pingHealth,
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

interface GatewayStatus {
  online: boolean;
  latencyMs: number | null;
  metrics: MetricsResponse;
  highSeverityAlerts: AssessmentRecord[];
}

const StatusContext = createContext<GatewayStatus>({
  online: false,
  latencyMs: null,
  metrics: EMPTY_METRICS,
  highSeverityAlerts: [],
});

export function useGatewayStatus() {
  return useContext(StatusContext);
}

export function GatewayStatusProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse>(EMPTY_METRICS);
  const [highSeverityAlerts, setHighSeverityAlerts] = useState<AssessmentRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const pollHealth = async () => {
      const result = await pingHealth();
      if (cancelled) return;
      setOnline(result.ok);
      setLatencyMs(result.latencyMs);
    };

    const pollMetrics = async () => {
      try {
        const [nextMetrics, recent] = await Promise.all([fetchMetrics(), fetchRecent(20)]);
        if (cancelled) return;
        setMetrics(nextMetrics);
        setHighSeverityAlerts(
          recent.filter((record) => {
            const severity = record.severity.toUpperCase();
            return severity === 'HIGH' || severity === 'CRITICAL';
          }),
        );
      } catch {
        if (!cancelled) {
          setHighSeverityAlerts([]);
        }
      }
    };

    pollHealth();
    pollMetrics();
    const healthTimer = window.setInterval(pollHealth, 5000);
    const metricsTimer = window.setInterval(pollMetrics, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(healthTimer);
      window.clearInterval(metricsTimer);
    };
  }, []);

  const value = useMemo(
    () => ({ online, latencyMs, metrics, highSeverityAlerts }),
    [online, latencyMs, metrics, highSeverityAlerts],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}
