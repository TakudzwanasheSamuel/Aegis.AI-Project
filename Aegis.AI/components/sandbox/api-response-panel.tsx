'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Terminal } from 'lucide-react';

import type { FastApiResponse } from '@/lib/sandbox/types';
import { cn } from '@/lib/utils';

interface ApiResponsePanelProps {
  response: FastApiResponse | null;
  loading: boolean;
}

export function ApiResponsePanel({ response, loading }: ApiResponsePanelProps) {
  const assessment = response?.assessment ?? null;
  const shapData =
    assessment?.top_shap_features.map((item) => ({
      feature: item.feature,
      impact: item.impact,
    })) ?? [];

  return (
    <div className="glass-panel flex h-full min-h-[520px] flex-col rounded-card border border-white/[0.08] p-6">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-aegis-accent-primary/20 bg-aegis-accent-primary/10">
            <Terminal className="h-4 w-4 text-aegis-accent-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-aegis-text-primary">
              FastAPI Gateway Response
            </h3>
            <p className="text-xs text-aegis-text-muted">
              Live inference · POST /api/v1/telemetry/assess
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-aegis-success animate-pulse-glow" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
            Live
          </span>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0A0C10]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-aegis-danger/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-aegis-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-aegis-success/80" />
          <span className="ml-2 font-mono text-[10px] text-aegis-text-muted">
            aegis-fastapi-gateway :: response.json
          </span>
        </div>

        <div className="h-[calc(100%-36px)] overflow-auto p-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
              <div className="h-3 w-full rounded bg-white/[0.06]" />
              <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
              <p className="pt-4 font-mono text-xs text-aegis-accent-secondary">
                Awaiting inference response…
              </p>
            </div>
          ) : response?.error ? (
            <p className="font-mono text-xs leading-relaxed text-aegis-danger">{response.error}</p>
          ) : assessment ? (
            <pre className="font-mono text-[11px] leading-relaxed text-aegis-text-secondary">
              {JSON.stringify(
                {
                  prediction: assessment.prediction,
                  confidence: assessment.confidence,
                  risk_score: assessment.risk_score,
                  severity: assessment.severity,
                  top_shap_features: assessment.top_shap_features,
                  recommendation: assessment.recommendation,
                },
                null,
                2,
              )}
            </pre>
          ) : (
            <p className="font-mono text-xs text-aegis-text-muted">
              {'// Load a scenario, send telemetry, or upload a payload to view the API response.'}
            </p>
          )}
        </div>
      </div>

      {assessment && !loading && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricPill
              label="Status"
              value={String(response?.status_code ?? 200)}
              tone="success"
            />
            <MetricPill
              label="Inference"
              value={`${response?.inference_time_ms ?? 0}ms`}
              tone="info"
            />
            <MetricPill
              label="Prediction"
              value={assessment.prediction}
              tone={severityTone(assessment.severity)}
            />
            <MetricPill
              label="Risk Score"
              value={`${assessment.risk_score}%`}
              tone={severityTone(assessment.severity)}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MetricPill
              label="Confidence"
              value={`${(assessment.confidence * 100).toFixed(1)}%`}
              tone="info"
            />
            <MetricPill
              label="Severity"
              value={assessment.severity}
              tone={severityTone(assessment.severity)}
            />
          </div>

          {shapData.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-semibold text-aegis-text-primary">
                Live SHAP attributions
              </p>
              <p className="mt-0.5 text-[10px] text-aegis-text-muted">
                Random Forest TreeExplainer · malware-class impact
              </p>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fontSize: 10, fill: '#CBD5E1' }}
                      axisLine={false}
                      tickLine={false}
                      width={148}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: '#181A20',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC',
                      }}
                    />
                    <Bar dataKey="impact" radius={[0, 6, 6, 0]} barSize={16}>
                      {shapData.map((entry) => (
                        <Cell
                          key={entry.feature}
                          fill={entry.impact >= 0 ? '#EF4444' : '#10B981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function severityTone(severity: string): 'success' | 'warning' | 'danger' | 'info' {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'success';
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}) {
  const toneClass = {
    success: 'border-aegis-success/20 bg-aegis-success/10 text-aegis-success',
    warning: 'border-aegis-warning/20 bg-aegis-warning/10 text-aegis-warning',
    danger: 'border-aegis-danger/20 bg-aegis-danger/10 text-aegis-danger',
    info: 'border-aegis-accent-secondary/20 bg-aegis-accent-secondary/10 text-aegis-accent-secondary',
  }[tone];

  return (
    <div className={cn('rounded-lg border px-3 py-2', toneClass)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
