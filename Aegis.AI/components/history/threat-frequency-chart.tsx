'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ThreatFrequencyPoint } from '@/lib/history/types';

interface ThreatFrequencyChartProps {
  data: ThreatFrequencyPoint[];
  subtitle: string;
}

export function ThreatFrequencyChart({ data, subtitle }: ThreatFrequencyChartProps) {
  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">
          Threat Frequency Over Time
        </h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">{subtitle}</p>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="historyIndigoNavy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.55} />
                <stop offset="60%" stopColor="#4338CA" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              allowDecimals={false}
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
              formatter={(value: number) => [`${value} alerts`, 'Count']}
            />
            <Area
              type="monotone"
              dataKey="alerts"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#historyIndigoNavy)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
