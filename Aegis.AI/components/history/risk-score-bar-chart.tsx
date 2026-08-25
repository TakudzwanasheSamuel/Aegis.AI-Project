'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RiskScoreComparisonPoint } from '@/lib/history/types';

interface RiskScoreBarChartProps {
  data: RiskScoreComparisonPoint[];
}

export function RiskScoreBarChart({ data }: RiskScoreBarChartProps) {
  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">
          Average Risk Score by Detection Type
        </h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          Stacked comparison · benign vs. malicious process detections
        </p>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181A20',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              labelStyle={{ color: '#94A3B8' }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} avg risk`,
                name === 'benign' ? 'Benign' : 'Malicious',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              formatter={(value) => (value === 'benign' ? 'Benign' : 'Malicious')}
            />
            <Bar
              dataKey="benign"
              stackId="risk"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
              name="benign"
            />
            <Bar
              dataKey="malicious"
              stackId="risk"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              name="malicious"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
