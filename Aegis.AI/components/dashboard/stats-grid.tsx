'use client';

import { ShieldCheck, Cpu, Gauge, AlertTriangle } from 'lucide-react';

import type { MetricsResponse } from '@/lib/api';

interface DashboardStatsProps {
  metrics: MetricsResponse;
  agentConnected: boolean;
}

export function DashboardStats({ metrics, agentConnected }: DashboardStatsProps) {
  const threatLevel =
    metrics.threats_detected > 0 ? 'HIGH RISK' : agentConnected ? 'LOW RISK' : 'STANDBY';
  const threatOk = metrics.threats_detected === 0;

  const stats = [
    {
      label: 'System Threat Status',
      icon: ShieldCheck,
      badge: threatLevel,
      subtext: agentConnected
        ? threatOk
          ? 'Endpoints operating within baseline'
          : `${metrics.threats_detected} high-severity assessment(s)`
        : 'Start endpoint_agent.py to stream live telemetry',
      glow: threatOk ? 'shadow-glow-success' : 'shadow-glow-danger',
      border: threatOk ? 'border-aegis-success/30' : 'border-aegis-danger/30',
      badgeColor: threatOk ? 'text-aegis-success' : 'text-aegis-danger',
      badgeBg: threatOk ? 'bg-aegis-success/10' : 'bg-aegis-danger/10',
    },
    {
      label: 'Total Scanned Processes',
      icon: Cpu,
      value: String(metrics.total_scanned),
      valueSuffix: 'Assessments',
      subtext: `${metrics.safe_processes} classified Safe / LOW`,
      accent: 'text-aegis-accent-secondary',
    },
    {
      label: 'Average Threat Risk Score',
      icon: Gauge,
      value: `${metrics.avg_risk_score.toFixed(1)}%`,
      subtext: 'Mean ensemble malware probability',
      accent: 'text-aegis-info',
    },
    {
      label: 'Active Threat Alerts',
      icon: AlertTriangle,
      value: String(metrics.threats_detected),
      valueSuffix: 'HIGH / CRITICAL',
      subtext: metrics.threats_detected ? 'Requires SHAP review' : 'No high-severity alerts',
      accent: metrics.threats_detected ? 'text-aegis-danger' : 'text-aegis-success',
      glow: metrics.threats_detected ? 'shadow-glow-danger' : undefined,
      border: metrics.threats_detected ? 'border-aegis-danger/30' : undefined,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={`surface-card rounded-card p-5 transition-all duration-300 hover:border-white/[0.12] hover:shadow-glow-primary ${
              s.glow ? `${s.glow} ${s.border ?? ''}` : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Icon className={`h-5 w-5 ${s.accent || 'text-aegis-success'}`} />
              </div>
              {s.badge && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.badgeBg} ${s.badgeColor}`}>
                  {s.badge}
                </span>
              )}
            </div>
            {s.badge ? (
              <div className="mt-4">
                <p className="text-xs text-aegis-text-muted">{s.label}</p>
                <p className="mt-1 text-xs text-aegis-text-secondary">{s.subtext}</p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-2xl font-bold tabular-nums text-aegis-text-primary">
                  {s.value}
                  {s.valueSuffix && (
                    <span className="ml-1.5 text-sm font-medium text-aegis-text-muted">
                      {s.valueSuffix}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-aegis-text-muted">{s.label}</p>
                <p className="mt-0.5 text-[11px] text-aegis-text-muted">{s.subtext}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
