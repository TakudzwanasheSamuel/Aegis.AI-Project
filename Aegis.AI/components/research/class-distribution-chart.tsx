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

export function ClassDistributionChart({
  preBenign,
  preMalware,
  postBenign,
  postMalware,
}: {
  preBenign: number;
  preMalware: number;
  postBenign: number;
  postMalware: number;
}) {
  const data = [
    { split: 'Pre-SMOTE train', benign: preBenign, malware: preMalware },
    { split: 'Post-SMOTE train', benign: postBenign, malware: postMalware },
  ];

  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">Class Distribution — SMOTE</h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          Training-fold counts from training_metrics.json · CIC-MalMem-2022 is already balanced
        </p>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="split"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181A20',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'benign' ? 'Benign Samples' : 'Malware Samples',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              formatter={(value) => (value === 'benign' ? 'Benign' : 'Malware')}
            />
            <Bar dataKey="benign" fill="#10B981" radius={[4, 4, 0, 0]} name="benign" />
            <Bar dataKey="malware" fill="#EF4444" radius={[4, 4, 0, 0]} name="malware" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
