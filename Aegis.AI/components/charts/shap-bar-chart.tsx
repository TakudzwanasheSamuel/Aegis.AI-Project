'use client';

import { motion } from 'framer-motion';
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { monoLabelWidth, useChartKit } from '@/components/charts/chart-kit';
import { EASE } from '@/lib/motion';

export interface ShapBarDatum {
  feature: string;
  value: number;
}

interface ShapBarChartProps {
  data: ShapBarDatum[];
  /** Plot height in px. */
  height?: number;
  xTickFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => [string, string];
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  value?: number | [number, number];
  fill?: string;
  /** True for bars pointing toward benign (negative SHAP). */
  negative?: boolean;
}

/**
 * One SHAP bar that grows out of the zero line (left for benign, right for
 * malware), staggered 30ms per row. MotionConfig turns the scale off under
 * reduced motion.
 */
function GrowingBar({ x = 0, y = 0, width = 0, height = 0, index = 0, fill, negative }: BarShapeProps) {
  const left = Math.min(x, x + width);
  const w = Math.abs(width);
  // Negative bars sit left of zero, so they grow leftward from their right edge.
  const growsLeft = negative ?? width < 0;
  return (
    <motion.rect
      x={left}
      y={y}
      width={w}
      height={height}
      fill={fill}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.45, ease: EASE, delay: index * 0.03 }}
      style={{ originX: growsLeft ? 1 : 0, transformBox: 'fill-box' }}
    />
  );
}

/**
 * Horizontal SHAP attribution bars shared by /analysis and the history modal.
 * Rows are ordered by absolute impact; bars toward malware use the high token,
 * bars toward benign the safe token, with a thin zero line.
 */
export function ShapBarChart({
  data,
  height = 288,
  xTickFormatter,
  tooltipFormatter = (value) => [value.toFixed(4), 'Attribution'],
}: ShapBarChartProps) {
  const kit = useChartKit();
  const rows = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const yAxisWidth = monoLabelWidth(rows.map((row) => row.feature));
  // Re-run the grow animation when the vector changes.
  const dataKey = rows.map((row) => `${row.feature}:${row.value}`).join('|');

  return (
    // Narrow screens scroll the chart inside its container instead of squeezing the labels.
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="min-w-[520px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={dataKey}
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          >
            <XAxis
              type="number"
              tick={kit.numericTick}
              axisLine={kit.axisLine}
              tickLine={false}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={kit.numericTick}
              axisLine={false}
              tickLine={false}
              width={yAxisWidth}
            />
            <ReferenceLine x={0} stroke={kit.colors.muted} strokeWidth={1} />
            <Tooltip {...kit.tooltip} formatter={tooltipFormatter} />
            <Bar
              dataKey="value"
              barSize={16}
              isAnimationActive={false}
              shape={(raw: unknown) => {
                const props = raw as BarShapeProps & { payload?: ShapBarDatum };
                const impact = props.payload?.value ?? 0;
                return (
                  <GrowingBar
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    index={props.index}
                    negative={impact < 0}
                    fill={impact >= 0 ? kit.colors.high : kit.colors.safe}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
