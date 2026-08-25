'use client';

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BrainCircuit, FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HistoricalIncident } from '@/lib/history/types';

interface ShapDetailModalProps {
  incident: HistoricalIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShapDetailModal({ incident, open, onOpenChange }: ShapDetailModalProps) {
  if (!incident) return null;

  const topPositive = incident.shapVector
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/[0.08] bg-aegis-surface text-aegis-text-primary">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-aegis-accent-primary/20 bg-aegis-accent-primary/10">
              <BrainCircuit className="h-5 w-5 text-aegis-accent-primary" />
            </div>
            <div>
              <DialogTitle className="text-aegis-text-primary">
                Historical SHAP Explanation
              </DialogTitle>
              <DialogDescription className="text-aegis-text-muted">
                {incident.processName} · PID {incident.pid} · {incident.endpointId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={incident.shapVector}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <defs>
                <linearGradient id="modalShapRed" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="modalShapGreen" x1="0" y1="0" x2="1" y2="0">
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
                tickFormatter={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
              />
              <YAxis
                type="category"
                dataKey="feature"
                tick={{ fontSize: 11, fill: '#CBD5E1' }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  backgroundColor: '#181A20',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
                formatter={(value: number) => [
                  `${value >= 0 ? '+' : ''}${value.toFixed(2)} SHAP impact`,
                  'Attribution',
                ]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                {incident.shapVector.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.value >= 0 ? 'url(#modalShapRed)' : 'url(#modalShapGreen)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-aegis-accent-primary/15 bg-aegis-accent-primary/[0.06] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aegis-accent-primary/15">
              <FileText className="h-4 w-4 text-aegis-accent-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-aegis-accent-primary">
                Archived Diagnostic Summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-aegis-text-secondary">
                {incident.severity === 'Safe' ? (
                  <>
                    Process classified as <span className="font-semibold text-aegis-success">SAFE</span>{' '}
                    with no significant malicious indicators in the persisted SHAP vector.
                  </>
                ) : (
                  <>
                    Process flagged as{' '}
                    <span className="font-semibold text-aegis-danger">
                      {incident.severity.toUpperCase()}
                    </span>{' '}
                    primarily due to{' '}
                    {topPositive.map((e, i) => (
                      <span key={e.feature}>
                        {i > 0 ? ' combined with ' : ''}
                        <span className="font-mono text-aegis-danger">
                          {e.feature} ({e.value >= 0 ? '+' : ''}
                          {e.value.toFixed(2)})
                        </span>
                      </span>
                    ))}
                    . Action taken: {incident.actionTaken}.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-aegis-text-muted">
          Vector persisted with assessment #{incident.id} in SQLite assessment_records
        </p>
      </DialogContent>
    </Dialog>
  );
}
