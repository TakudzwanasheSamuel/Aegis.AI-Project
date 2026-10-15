'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartCaption, ChartLegend, useChartKit } from '@/components/charts/chart-kit';
import { Panel } from '@/components/ui-aegis';

export function ClassDistributionChart({
  benign,
  malware,
}: {
  benign: number;
  malware: number;
}) {
  const kit = useChartKit();
  const data = [{ split: 'CIC-MalMem-2022', benign, malware }];
  const countLabel = {
    position: 'top' as const,
    fill: kit.colors.ink2,
    fontSize: 12,
    fontFamily: kit.colors.fontMono,
    formatter: (value: number) => value.toLocaleString(),
  };

  return (
    <Panel
      title="Class Distribution"
      meta={
        <ChartLegend
          items={[
            { label: 'Benign', swatchClassName: 'bg-aegis-safe' },
            { label: 'Malware', swatchClassName: 'bg-aegis-high' },
          ]}
        />
      }
    >
      <figure>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barGap={8}>
              <CartesianGrid {...kit.grid} />
              <XAxis dataKey="split" tick={kit.tick} axisLine={kit.axisLine} tickLine={false} />
              <YAxis
                tick={kit.numericTick}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...kit.tooltip}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'benign' ? 'Benign Samples' : 'Malware Samples',
                ]}
              />
              <Bar
                dataKey="benign"
                fill={kit.colors.safe}
                radius={[2, 2, 0, 0]}
                name="benign"
                maxBarSize={96}
                isAnimationActive={kit.animate}
                animationDuration={kit.duration}
              >
                <LabelList dataKey="benign" {...countLabel} />
              </Bar>
              <Bar
                dataKey="malware"
                fill={kit.colors.high}
                radius={[2, 2, 0, 0]}
                name="malware"
                maxBarSize={96}
                isAnimationActive={kit.animate}
                animationDuration={kit.duration}
              >
                <LabelList dataKey="malware" {...countLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartCaption>Benign and malware counts from training_metrics.json</ChartCaption>
      </figure>
    </Panel>
  );
}
