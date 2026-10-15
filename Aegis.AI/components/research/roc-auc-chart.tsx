'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartCaption, ChartLegend, useChartKit } from '@/components/charts/chart-kit';
import { Panel } from '@/components/ui-aegis';
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
  const kit = useChartKit();

  return (
    <Panel
      title="ROC-AUC Curve"
      meta={
        <ChartLegend
          items={[
            {
              label: `Random Forest (AUC ${rfAuc.toFixed(4)})`,
              swatchClassName: 'bg-series-1',
              shape: 'line',
            },
            { label: `XGBoost (AUC ${xgbAuc.toFixed(4)})`, swatchClassName: 'bg-series-2', shape: 'line' },
          ]}
        />
      }
    >
      <figure>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 12, bottom: 16, left: 4 }}>
              <CartesianGrid {...kit.grid} />
              <XAxis
                dataKey="fpr"
                type="number"
                domain={[0, 1]}
                tick={kit.numericTick}
                axisLine={kit.axisLine}
                tickLine={false}
                label={{
                  value: 'False Positive Rate',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 12, fill: kit.colors.muted, fontFamily: kit.colors.fontSans },
                }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                tick={kit.numericTick}
                axisLine={kit.axisLine}
                tickLine={false}
                label={{
                  value: 'True Positive Rate',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    fontSize: 12,
                    fill: kit.colors.muted,
                    fontFamily: kit.colors.fontSans,
                    textAnchor: 'middle',
                  },
                }}
              />
              <Tooltip
                {...kit.tooltip}
                cursor={{ stroke: kit.colors.rule }}
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
                stroke={kit.colors.muted}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="tprRandomForest"
                stroke={kit.colors.series1}
                strokeWidth={2}
                dot={false}
                name="tprRandomForest"
                isAnimationActive={kit.animate}
                animationDuration={kit.duration}
              />
              <Line
                type="monotone"
                dataKey="tprXgboost"
                stroke={kit.colors.series2}
                strokeWidth={2}
                dot={false}
                name="tprXgboost"
                isAnimationActive={kit.animate}
                animationDuration={kit.duration}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartCaption>
          True Positive Rate vs False Positive Rate · RF{' '}
          <span className="font-mono tabular-nums">{rfAuc.toFixed(4)}</span> vs XGBoost{' '}
          <span className="font-mono tabular-nums">{xgbAuc.toFixed(4)}</span>
        </ChartCaption>
      </figure>
    </Panel>
  );
}
