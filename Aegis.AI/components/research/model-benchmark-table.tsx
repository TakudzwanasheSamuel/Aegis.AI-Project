'use client';

import { useEffect, useState } from 'react';

import { CountUp } from '@/components/motion/count-up';
import { RoleBadge } from '@/components/research/methodology-overview';
import { Skeleton } from '@/components/ui-aegis';
import { Panel } from '@/components/ui-aegis';
import { fetchResearchBenchmark, type ModelSplitMetrics, type ResearchBenchmark } from '@/lib/api';
import { cn } from '@/lib/utils';

type MetricFormat = 'percent' | 'auc';

function formatMetric(value: number, format: MetricFormat) {
  return format === 'percent' ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
}

function MetricCell({
  value,
  format = 'percent',
  best,
}: {
  value: number;
  format?: MetricFormat;
  best?: boolean;
}) {
  return (
    <td
      className={cn(
        'h-11 whitespace-nowrap px-4 text-right font-mono text-sm tabular-nums',
        best ? 'font-semibold text-aegis-ink' : 'text-aegis-ink-2',
      )}
    >
      <CountUp value={value} format={(n) => formatMetric(n, format)} />
    </td>
  );
}

const COLUMNS: { header: string; key?: keyof ModelSplitMetrics; format?: MetricFormat }[] = [
  { header: 'Algorithm' },
  { header: 'Accuracy', key: 'accuracy' },
  { header: 'Precision', key: 'precision' },
  { header: 'Recall', key: 'recall' },
  { header: 'F1-Score', key: 'f1' },
  { header: 'AUC-ROC', key: 'roc_auc', format: 'auc' },
];

export function ModelBenchmarkTable() {
  const [benchmark, setBenchmark] = useState<ResearchBenchmark | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResearchBenchmark()
      .then((data) => {
        setBenchmark(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load training_metrics.json');
      });
  }, []);

  const rows = benchmark?.models
    ? [
        {
          algorithm: 'Random Forest Classifier',
          role: 'primary' as const,
          metrics: benchmark.models.RandomForest,
        },
        {
          algorithm: 'XGBoost Classifier',
          role: 'benchmark' as const,
          metrics: benchmark.models.XGBoost,
        },
      ].filter((row) => row.metrics)
    : [];

  // Best value per metric at the displayed precision; ties are all bold.
  const isBest = (key: keyof ModelSplitMetrics, format: MetricFormat, value: number) =>
    rows.length > 1 &&
    rows.every(
      (row) =>
        Number(formatMetric(row.metrics[key] as number, format).replace('%', '')) <=
        Number(formatMetric(value, format).replace('%', '')),
    );

  return (
    <Panel
      title="Model Comparative Benchmark"
      description={
        benchmark
          ? `Live from training_metrics.json · ${benchmark.dataset} · ${benchmark.n_samples.toLocaleString()} samples · ${benchmark.n_features} harmonized features`
          : 'Loading exported training metrics from FastAPI…'
      }
    >
      {error && <p className="mb-3 text-sm text-aegis-critical">{error}</p>}

      {/* Booktabs-style results table: thin top rule, heavier rule under the header, closing rule. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse border-y border-aegis-ink-2 text-sm">
          <thead>
            <tr className="border-b-2 border-aegis-ink-2">
              {COLUMNS.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={cn(
                    'h-10 whitespace-nowrap px-4 text-sm font-semibold text-aegis-ink',
                    column.key ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !error ? (
              <tr>
                <td colSpan={6} className="px-4 py-5">
                  <div className="space-y-2.5" aria-hidden="true">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                  </div>
                  <p className="mt-3 text-center text-sm text-aegis-muted">
                    Fetching GET /api/v1/analytics/research-benchmark…
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.algorithm} className="border-b border-aegis-rule last:border-b-0">
                  <th scope="row" className="h-11 whitespace-nowrap px-4 text-left font-medium text-aegis-ink">
                    {row.algorithm}
                    <RoleBadge role={row.role} />
                  </th>
                  {COLUMNS.filter((column) => column.key).map((column) => {
                    const key = column.key as keyof ModelSplitMetrics;
                    const format = column.format ?? 'percent';
                    const value = row.metrics[key] as number;
                    return (
                      <MetricCell
                        key={column.header}
                        value={value}
                        format={format}
                        best={isBest(key, format, value)}
                      />
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
