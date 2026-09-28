'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';

import { AcademicSummaryFooter } from '@/components/research/academic-summary-footer';
import { ClassDistributionChart } from '@/components/research/class-distribution-chart';
import { ConfusionMatrixGraphic } from '@/components/research/confusion-matrix';
import { FeatureImportanceChart } from '@/components/research/feature-importance-chart';
import { MethodologyOverview } from '@/components/research/methodology-overview';
import { ModelBenchmarkTable } from '@/components/research/model-benchmark-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { fetchResearchBenchmark, type ResearchBenchmark } from '@/lib/api';
import { downloadFile } from '@/lib/history/export';

export function ResearchWorkspace() {
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

  const confusion = benchmark?.models?.RandomForest?.confusion_matrix;
  const importance = benchmark?.feature_importance ?? [];
  const classes = benchmark?.class_distribution;

  return (
    <div>
      <PageHeader
        title="Research Evaluation"
        subtitle={
          benchmark
            ? `${benchmark.n_features} harmonized features mapped from ${benchmark.dataset} (${benchmark.n_samples.toLocaleString()} samples) · live training_metrics.json`
            : 'Live training_metrics.json'
        }
        icon={<BarChart3 className="h-6 w-6 text-aegis-accent-secondary" />}
        actions={
          <Button
            type="button"
            disabled={!benchmark}
            onClick={() => {
              if (!benchmark) return;
              downloadFile(
                JSON.stringify(benchmark, null, 2),
                'aegis-training-metrics.json',
                'application/json',
              );
            }}
            className="h-9 gap-2 btn-gradient text-xs font-semibold text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export Benchmark Data (JSON)
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-aegis-danger/20 bg-aegis-danger/10 px-3 py-2 text-xs text-aegis-danger">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <MethodologyOverview benchmark={benchmark} />
        <ModelBenchmarkTable />

        <div className="grid gap-4 lg:grid-cols-2">
          {confusion && (
            <ConfusionMatrixGraphic
              data={{
                truePositive: confusion.tp,
                falsePositive: confusion.fp,
                trueNegative: confusion.tn,
                falseNegative: confusion.fn,
              }}
            />
          )}
          {importance.length > 0 && <FeatureImportanceChart data={importance} />}
          {classes && (
            <ClassDistributionChart benign={classes.benign} malware={classes.malware} />
          )}
        </div>

        <AcademicSummaryFooter benchmark={benchmark} />
      </div>
    </div>
  );
}
