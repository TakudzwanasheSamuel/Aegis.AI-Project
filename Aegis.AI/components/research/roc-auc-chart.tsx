'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RocCurvePoint } from '@/lib/research/types';

export function RocAucChart({
  data,
  rfAuc,
  xgbAuc,
}: {
  data: RocCurvePoint[];
  rfAuc: number;
  xgbAuc: number;
}) {
  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">ROC-AUC Curve</h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          True Positive Rate vs False Positive Rate · RF {rfAuc.toFixed(4)} vs XGBoost {xgbAuc.toFixed(4)}
        </p>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="fpr"
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'False Positive Rate',
                position: 'insideBottom',
                offset: -2,
                style: { fontSize: 10, fill: '#64748B' },
              }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'True Positive Rate',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#64748B' },
              }}
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
                value.toFixed(3),
                name === 'tprRandomForest' ? 'Random Forest TPR' : 'XGBoost TPR',
              ]}
              labelFormatter={(fpr) => `FPR: ${Number(fpr).toFixed(2)}`}
            />
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ]}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              formatter={(value) =>
                value === 'tprRandomForest'
                  ? `Random Forest (AUC ${rfAuc.toFixed(4)})`
                  : `XGBoost (AUC ${xgbAuc.toFixed(4)})`
              }
            />
            <Line
              type="monotone"
              dataKey="tprRandomForest"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={false}
              name="tprRandomForest"
            />
            <Line
              type="monotone"
              dataKey="tprXgboost"
              stroke="#22D3EE"
              strokeWidth={2}
              dot={false}
              name="tprXgboost"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
