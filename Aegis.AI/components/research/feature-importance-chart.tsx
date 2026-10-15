'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartCaption, monoLabelWidth, useChartKit } from '@/components/charts/chart-kit';
import { Panel } from '@/components/ui-aegis';
import type { FeatureImportanceEntry } from '@/lib/research/types';

export function FeatureImportanceChart({ data }: { data: FeatureImportanceEntry[] }) {
  const kit = useChartKit();
  const maxImportance = Math.max(...data.map((item) => item.importance), 0.01);
  // Largest importance first.
  const rows = [...data].sort((a, b) => b.importance - a.importance);

  return (
    <Panel title="Global Feature Importance">
      <figure>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="h-72 min-w-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <XAxis
                  type="number"
                  domain={[0, Number((maxImportance * 1.1).toFixed(3))]}
                  tick={kit.numericTick}
                  axisLine={kit.axisLine}
                  tickLine={false}
                  tickFormatter={(value) => Number(value).toFixed(2)}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={kit.numericTick}
                  axisLine={false}
                  tickLine={false}
                  width={monoLabelWidth(rows.map((row) => row.feature))}
                />
                <Tooltip
                  {...kit.tooltip}
                  formatter={(value: number) => [value.toFixed(4), 'Mean Decrease Impurity']}
                />
                <Bar
                  dataKey="importance"
                  fill={kit.colors.series1}
                  radius={[0, 2, 2, 0]}
                  barSize={16}
                  isAnimationActive={kit.animate}
                  animationDuration={kit.duration}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ChartCaption>
          Random Forest mean decrease in impurity · 8 harmonized CIC-MalMem-2022 features
        </ChartCaption>
      </figure>
    </Panel>
  );
}
