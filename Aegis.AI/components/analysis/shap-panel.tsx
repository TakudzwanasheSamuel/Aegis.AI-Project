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
import { BrainCircuit, FileText } from 'lucide-react';

import type { ShapImpact } from '@/lib/api';

interface ShapExplainabilityPanelProps {
  features: ShapImpact[];
  prediction: string;
  severity: string;
}

export function ShapExplainabilityPanel({
  features,
  prediction,
  severity,
}: ShapExplainabilityPanelProps) {
  const shapData = features.map((item) => ({
    feature: item.feature,
    value: item.impact,
  }));

  const topPositive = [...shapData]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const summary =
    topPositive.length > 0
      ? `The snapshot was labelled ${prediction} (${severity}) primarily due to ${topPositive
          .map((entry) => `${entry.feature} (${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(3)})`)
          .join(' and ')}.`
      : `The snapshot was labelled ${prediction} (${severity}). SHAP attributions are available above.`;

  return (
    <div className="surface-card rounded-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-aegis-accent-primary/20 bg-aegis-accent-primary/10">
          <BrainCircuit className="h-5 w-5 text-aegis-accent-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">SHAP Feature Attribution</h3>
          <p className="mt-0.5 text-xs text-aegis-text-muted">
            TreeExplainer · Per-feature impact on the ransomware class
          </p>
        </div>
      </div>

      <div className="mt-6 h-72">
        {shapData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-aegis-text-muted">
            No SHAP vector stored for this assessment.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="shapRed" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="shapGreen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="feature"
                tick={{ fontSize: 10, fill: '#CBD5E1' }}
                axisLine={false}
                tickLine={false}
                width={160}
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
                formatter={(value: number) => [value.toFixed(4), 'Attribution']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {shapData.map((entry) => (
                  <Cell
                    key={entry.feature}
                    fill={entry.value >= 0 ? 'url(#shapRed)' : 'url(#shapGreen)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5 text-aegis-text-muted">
          <span className="h-2.5 w-2.5 rounded-sm bg-aegis-danger" />
          Increases ransomware risk
        </span>
        <span className="flex items-center gap-1.5 text-aegis-text-muted">
          <span className="h-2.5 w-2.5 rounded-sm bg-aegis-success" />
          Pulls toward benign
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-aegis-accent-primary/15 bg-aegis-accent-primary/[0.06] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aegis-accent-primary/15">
            <FileText className="h-4 w-4 text-aegis-accent-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-aegis-accent-primary">
              Automated Diagnostic Summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-aegis-text-secondary">{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
