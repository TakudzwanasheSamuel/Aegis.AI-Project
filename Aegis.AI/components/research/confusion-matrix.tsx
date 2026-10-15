'use client';

import { CountUp } from '@/components/motion/count-up';
import { Panel } from '@/components/ui-aegis';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { ConfusionMatrixData } from '@/lib/research/types';

/** Parse 'rgb(31 95 139)' into channels; null for placeholders like 'currentColor'. */
function channels(color: string): [number, number, number] | null {
  const match = color.match(/rgb\((\d+)\s+(\d+)\s+(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function MatrixCell({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const colors = useThemeColors();
  // Single-hue scale: 8% accent for the smallest count up to 85% for the largest.
  const alpha = 0.08 + 0.77 * (max > 0 ? value / max : 0);

  // Pick ink or on-accent text, whichever contrasts more with the blended cell colour.
  const accent = channels(colors.accent);
  const surface = channels(colors.surface);
  const ink = channels(colors.ink);
  const onAccent = channels(colors.onAccent);
  let useInk = true;
  if (accent && surface && ink && onAccent) {
    const blended = accent.map((c, i) => Math.round(c * alpha + surface[i] * (1 - alpha))) as [
      number,
      number,
      number,
    ];
    useInk = contrast(ink, blended) >= contrast(onAccent, blended);
  }

  return (
    <div
      className="flex min-h-[6.5rem] flex-col items-center justify-center rounded-sm px-2 py-4 text-center"
      style={{ backgroundColor: `rgb(var(--aegis-accent) / ${alpha.toFixed(3)})` }}
    >
      <span className={useInk ? 'text-xs text-aegis-ink-2' : 'text-xs text-aegis-on-accent'}>
        {label}
      </span>
      <span
        className={
          useInk
            ? 'mt-1.5 font-mono text-2xl font-medium tabular-nums text-aegis-ink sm:text-3xl'
            : 'mt-1.5 font-mono text-2xl font-medium tabular-nums text-aegis-on-accent sm:text-3xl'
        }
      >
        <CountUp value={value} />
      </span>
    </div>
  );
}

export function ConfusionMatrixGraphic({ data }: { data: ConfusionMatrixData }) {
  const total = data.truePositive + data.falsePositive + data.trueNegative + data.falseNegative;
  const accuracy = total > 0 ? (((data.truePositive + data.trueNegative) / total) * 100).toFixed(2) : '—';
  const max = Math.max(data.truePositive, data.falsePositive, data.trueNegative, data.falseNegative);

  return (
    <Panel title="Confusion Matrix — Random Forest">
      <figure>
        <div
          className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-1.5"
          role="table"
          aria-label="Confusion Matrix — Random Forest"
        >
          <div role="row" className="contents">
            <div role="columnheader" />
            <div role="columnheader" className="pb-1 text-center text-xs font-medium text-aegis-muted">
              Predicted +
            </div>
            <div role="columnheader" className="pb-1 text-center text-xs font-medium text-aegis-muted">
              Predicted −
            </div>
          </div>

          <div role="row" className="contents">
            <div role="rowheader" className="flex items-center pr-2 text-xs font-medium text-aegis-muted">
              Actual +
            </div>
            <div role="cell">
              <MatrixCell label="True Positive (TP)" value={data.truePositive} max={max} />
            </div>
            <div role="cell">
              <MatrixCell label="False Negative (FN)" value={data.falseNegative} max={max} />
            </div>
          </div>

          <div role="row" className="contents">
            <div role="rowheader" className="flex items-center pr-2 text-xs font-medium text-aegis-muted">
              Actual −
            </div>
            <div role="cell">
              <MatrixCell label="False Positive (FP)" value={data.falsePositive} max={max} />
            </div>
            <div role="cell">
              <MatrixCell label="True Negative (TN)" value={data.trueNegative} max={max} />
            </div>
          </div>
        </div>

        <figcaption className="mt-3 text-xs leading-relaxed text-aegis-muted">
          Held-out test set · Accuracy <span className="font-mono tabular-nums">{accuracy}%</span> · 8
          harmonized features
        </figcaption>
      </figure>
    </Panel>
  );
}
