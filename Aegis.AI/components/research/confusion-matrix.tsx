'use client';

import type { ConfusionMatrixData } from '@/lib/research/types';
import { cn } from '@/lib/utils';

function MatrixCell({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'positive' | 'negative' | 'neutral';
}) {
  const styles = {
    positive: 'bg-aegis-success/15 border-aegis-success/25 text-aegis-success',
    negative: 'bg-aegis-danger/15 border-aegis-danger/25 text-aegis-danger',
    neutral: 'bg-aegis-warning/10 border-aegis-warning/20 text-aegis-warning',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border p-4 transition-transform hover:scale-[1.02]',
        styles[variant],
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
      <span className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

export function ConfusionMatrixGraphic({ data }: { data: ConfusionMatrixData }) {
  const total = data.truePositive + data.falsePositive + data.trueNegative + data.falseNegative;
  const accuracy = total > 0 ? (((data.truePositive + data.trueNegative) / total) * 100).toFixed(2) : '—';

  return (
    <div className="surface-card rounded-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">Confusion Matrix — Random Forest</h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          Held-out test set · Accuracy {accuracy}% · 8 harmonized features
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
          <div />
          <div>Predicted +</div>
          <div>Predicted −</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
            Actual +
          </div>
          <MatrixCell label="True Positive (TP)" value={data.truePositive} variant="positive" />
          <MatrixCell label="False Negative (FN)" value={data.falseNegative} variant="neutral" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
            Actual −
          </div>
          <MatrixCell label="False Positive (FP)" value={data.falsePositive} variant="neutral" />
          <MatrixCell label="True Negative (TN)" value={data.trueNegative} variant="positive" />
        </div>
      </div>
    </div>
  );
}
