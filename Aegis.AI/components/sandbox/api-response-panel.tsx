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
    <div className="glass-panel flex h-full flex-col rounded-card border border-white/[0.08] p-6">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">Result</h3>
          <p className="text-xs text-aegis-text-muted">
            The verdict from the last scenario you sent
          </p>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-aegis-text-muted">Waiting for a result…</p>
      )}

      {!loading && response?.error && (
        <p className="mt-4 text-sm text-aegis-danger">{response.error}</p>
      )}

      {!loading && !assessment && !response?.error && (
        <p className="mt-4 text-sm text-aegis-text-muted">
          Load a scenario to see the verdict here.
        </p>
      )}

      {assessment && !loading && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricPill
              label="Detector"
              value={
                assessment.triggered_by === 'behavioural'
                  ? 'Behavioural monitor'
                  : 'Memory-forensic model'
              }
              tone={assessment.triggered_by === 'behavioural' ? 'danger' : 'info'}
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
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricPill
              label="Severity"
              value={assessment.severity}
              tone={severityTone(assessment.severity)}
            />
            <MetricPill
              label="Confidence"
              value={`${(assessment.confidence * 100).toFixed(1)}%`}
              tone="info"
            />
            <MetricPill
              label="Status"
              value={String(response?.status_code ?? 200)}
              tone="success"
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

          {assessment.harmonized_vector && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-semibold text-aegis-text-primary">Harmonized vector</p>
              <table className="mt-3 w-full">
                <tbody>
                  {Object.entries(assessment.harmonized_vector).map(([key, value]) => (
                    <tr key={key} className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-3 font-mono text-[11px] text-aegis-text-secondary">{key}</td>
                      <td className="py-1.5 text-right font-mono text-[11px] tabular-nums text-aegis-text-primary">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
