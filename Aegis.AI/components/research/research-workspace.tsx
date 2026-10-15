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
import { Notice } from '@/components/ui-aegis';
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
        icon={<BarChart3 />}
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
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Benchmark Data (JSON)
          </Button>
        }
      />

      {error && <Notice className="mb-6">{error}</Notice>}

      <div className="space-y-6">
        <MethodologyOverview benchmark={benchmark} />
        <ModelBenchmarkTable />

        <div className="grid gap-6 lg:grid-cols-2">
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
          {classes && (
            <ClassDistributionChart benign={classes.benign} malware={classes.malware} />
          )}
          {importance.length > 0 && (
            <div className="min-w-0 lg:col-span-2">
              <FeatureImportanceChart data={importance} />
            </div>
          )}
        </div>

        <AcademicSummaryFooter benchmark={benchmark} />
      </div>
    </div>
  );
}
