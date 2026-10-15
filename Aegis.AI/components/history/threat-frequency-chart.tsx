'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartKit } from '@/components/charts/chart-kit';
import { Panel } from '@/components/ui-aegis';
import { withAlpha } from '@/hooks/use-theme-colors';
import type { ThreatFrequencyPoint } from '@/lib/history/types';

interface ThreatFrequencyChartProps {
  data: ThreatFrequencyPoint[];
  subtitle: string;
}

export function ThreatFrequencyChart({ data, subtitle }: ThreatFrequencyChartProps) {
  const kit = useChartKit();

  return (
    <Panel title="Threat Frequency Over Time" description={subtitle}>
      <div className="h-72">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-aegis-muted">
            No Moderate, High, or Critical assessments in this range.
          </p>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...kit.grid} />
            <XAxis dataKey="label" tick={kit.tick} axisLine={kit.axisLine} tickLine={false} />
            <YAxis
              tick={kit.numericTick}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              {...kit.tooltip}
              cursor={{ stroke: kit.colors.rule }}
              formatter={(value: number) => [`${value} alerts`, 'Count']}
            />
            <Area
              type="monotone"
              dataKey="alerts"
              stroke={kit.colors.accent}
              strokeWidth={2}
              fill={withAlpha(kit.colors.accent, 0.15)}
              fillOpacity={1}
              dot={{ r: 3, fill: kit.colors.accent, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={kit.animate}
              animationDuration={kit.duration}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
