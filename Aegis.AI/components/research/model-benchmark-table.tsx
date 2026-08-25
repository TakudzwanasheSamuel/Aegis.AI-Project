'use client';

import { useEffect, useState } from 'react';

import { RoleBadge } from '@/components/research/methodology-overview';
import { fetchResearchBenchmark, type ResearchBenchmark } from '@/lib/api';
import { cn } from '@/lib/utils';

function MetricCell({
  value,
  format = 'percent',
  highlight,
}: {
  value: number;
  format?: 'percent' | 'auc';
  highlight?: boolean;
}) {
  const formatted =
    format === 'percent' ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);

  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums',
        highlight ? 'font-semibold text-aegis-accent-primary' : 'text-aegis-text-secondary',
      )}
    >
      {formatted}
    </span>
  );
}

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

  const rows = benchmark
    ? [
        {
          algorithm: 'Random Forest Classifier',
          role: 'primary' as const,
          metrics: benchmark.random_forest,
        },
        {
          algorithm: 'XGBoost Classifier',
          role: 'benchmark' as const,
          metrics: benchmark.xgboost,
        },
      ]
    : [];

  return (
    <div className="surface-card rounded-card overflow-hidden">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <h3 className="text-sm font-semibold text-aegis-text-primary">
          Model Comparative Benchmark
        </h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          {benchmark
            ? `Live from training_metrics.json · ${benchmark.dataset} · ${benchmark.n_samples.toLocaleString()} samples · ${benchmark.n_features} harmonized features`
            : 'Loading exported training metrics from FastAPI…'}
        </p>
      </div>

      {error && (
        <p className="px-6 py-3 text-xs text-aegis-danger">{error}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Algorithm', 'Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC'].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-aegis-text-muted">
                  Fetching GET /api/v1/analytics/research-benchmark…
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.algorithm}
                  className={cn(
                    'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
                    row.role === 'primary' && 'bg-aegis-accent-primary/[0.04]',
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-aegis-text-primary">{row.algorithm}</span>
                    <RoleBadge role={row.role} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell value={row.metrics.accuracy} highlight={row.role === 'primary'} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell value={row.metrics.precision} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell value={row.metrics.recall} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell value={row.metrics.f1} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricCell value={row.metrics.roc_auc} format="auc" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
