'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { FeatureImportanceEntry } from '@/lib/research/types';

export function FeatureImportanceChart({ data }: { data: FeatureImportanceEntry[] }) {
  const maxImportance = Math.max(...data.map((item) => item.importance), 0.01);

  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">Global Feature Importance</h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          Random Forest mean decrease in impurity · 8 harmonized CIC-MalMem-2022 features
        </p>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="featureGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Number((maxImportance * 1.1).toFixed(3))]}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fontSize: 9, fill: '#CBD5E1' }}
              axisLine={false}
              tickLine={false}
              width={148}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                backgroundColor: '#181A20',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: number) => [value.toFixed(4), 'Mean Decrease Impurity']}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry) => (
                <Cell key={entry.feature} fill="url(#featureGrad)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
