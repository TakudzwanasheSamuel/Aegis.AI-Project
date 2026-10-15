'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartLegend, useChartKit } from '@/components/charts/chart-kit';
import { Panel } from '@/components/ui-aegis';
import type { RiskScoreComparisonPoint } from '@/lib/history/types';
import { SEVERITY_CLASSES, severityLevel } from '@/lib/severity';

interface RiskScoreBarChartProps {
  data: RiskScoreComparisonPoint[];
}

// Each stacked series is one severity band: benign = Safe, malicious = High.
const BENIGN_LEVEL = severityLevel('Safe');
const MALICIOUS_LEVEL = severityLevel('High');

export function RiskScoreBarChart({ data }: RiskScoreBarChartProps) {
  const kit = useChartKit();
  const levelColor = { safe: kit.colors.safe, moderate: kit.colors.moderate, high: kit.colors.high, critical: kit.colors.critical };

  return (
    <Panel
      title="Average Risk Score by Detection Type"
      description="Stacked comparison · benign vs. malicious process detections"
      meta={
        <ChartLegend
          items={[
            { label: 'Benign', swatchClassName: SEVERITY_CLASSES[BENIGN_LEVEL].bg },
            { label: 'Malicious', swatchClassName: SEVERITY_CLASSES[MALICIOUS_LEVEL].bg },
          ]}
        />
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...kit.grid} />
            <XAxis dataKey="label" tick={kit.tick} axisLine={kit.axisLine} tickLine={false} />
            <YAxis
              tick={kit.numericTick}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              width={36}
            />
            <Tooltip
              {...kit.tooltip}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} avg risk`,
                name === 'benign' ? 'Benign' : 'Malicious',
              ]}
            />
            <Bar
              dataKey="benign"
              stackId="risk"
              fill={levelColor[BENIGN_LEVEL]}
              radius={[0, 0, 0, 0]}
              name="benign"
              maxBarSize={48}
              isAnimationActive={kit.animate}
              animationDuration={kit.duration}
            />
            <Bar
              dataKey="malicious"
              stackId="risk"
              fill={levelColor[MALICIOUS_LEVEL]}
              radius={[2, 2, 0, 0]}
              name="malicious"
              maxBarSize={48}
              isAnimationActive={kit.animate}
              animationDuration={kit.duration}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
