'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskDoughnutChartProps {
  counts: Record<string, number>;
  total: number;
}

export function RiskDoughnutChart({ counts, total }: RiskDoughnutChartProps) {
  const data = [
    { name: 'Safe', value: counts.LOW ?? 0, color: '#10B981' },
    { name: 'Moderate', value: counts.MEDIUM ?? 0, color: '#F59E0B' },
    { name: 'High', value: counts.HIGH ?? 0, color: '#F97316' },
    { name: 'Critical', value: counts.CRITICAL ?? 0, color: '#EF4444' },
  ].filter((entry) => entry.value > 0 || total === 0);

  const chartData = total === 0 ? [{ name: 'None', value: 1, color: '#334155' }] : data;

  return (
    <div className="surface-card rounded-card p-5">
      <h3 className="text-sm font-semibold text-aegis-text-primary">Risk Distribution</h3>
      <p className="mt-0.5 text-xs text-aegis-text-muted">{total} persisted assessments</p>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181A20',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums text-aegis-text-primary">{total}</span>
            <span className="text-[10px] text-aegis-text-muted">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {[
            { name: 'Safe', value: counts.LOW ?? 0, color: '#10B981' },
            { name: 'Moderate', value: counts.MEDIUM ?? 0, color: '#F59E0B' },
            { name: 'High', value: counts.HIGH ?? 0, color: '#F97316' },
            { name: 'Critical', value: counts.CRITICAL ?? 0, color: '#EF4444' },
          ].map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-aegis-text-secondary">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-aegis-text-primary">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
