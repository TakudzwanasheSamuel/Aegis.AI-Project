'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface TrendPoint {
  time: string;
  risk: number;
}

interface ThreatTrendChartProps {
  data?: TrendPoint[];
}

export function ThreatTrendChart({ data = [] }: ThreatTrendChartProps) {
  const series = data.length > 0 ? data : [{ time: '—', risk: 0 }];

  return (
    <div className="surface-card rounded-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">Threat Trend</h3>
          <p className="mt-0.5 text-xs text-aegis-text-muted">Risk score · latest assessments</p>
        </div>
      </div>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181A20',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Area type="monotone" dataKey="risk" stroke="#6366F1" strokeWidth={2} fill="url(#indigoGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
