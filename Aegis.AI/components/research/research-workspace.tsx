'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';

import { AcademicSummaryFooter } from '@/components/research/academic-summary-footer';
import { ClassDistributionChart } from '@/components/research/class-distribution-chart';
import { ConfusionMatrixGraphic } from '@/components/research/confusion-matrix';
import { FeatureImportanceChart } from '@/components/research/feature-importance-chart';
import { MethodologyOverview } from '@/components/research/methodology-overview';
import { ModelBenchmarkTable } from '@/components/research/model-benchmark-table';
import { RocAucChart } from '@/components/research/roc-auc-chart';
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

  const confusion = benchmark?.random_forest.confusion_matrix;
  const importance = benchmark?.random_forest.feature_importance ?? [];
  const roc = benchmark?.roc_curve ?? [];
  const pre = benchmark?.class_distribution?.pre_smote_train;
  const post = benchmark?.class_distribution?.post_smote_train;

  return (
    <div>
      <PageHeader
        title="Research Evaluation"
        subtitle="8 harmonized features mapped from CIC-MalMem-2022 (58,596 samples) · live training_metrics.json"
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
                truePositive: confusion.true_positive,
                falsePositive: confusion.false_positive,
                trueNegative: confusion.true_negative,
                falseNegative: confusion.false_negative,
              }}
            />
          )}
          {roc.length > 0 && benchmark && (
            <RocAucChart
              data={roc}
              rfAuc={benchmark.random_forest.roc_auc}
              xgbAuc={benchmark.xgboost.roc_auc}
            />
          )}
          {importance.length > 0 && <FeatureImportanceChart data={importance} />}
          {pre && post && (
            <ClassDistributionChart
              preBenign={pre.benign}
              preMalware={pre.malware}
              postBenign={post.benign}
              postMalware={post.malware}
            />
          )}
        </div>

        <AcademicSummaryFooter benchmark={benchmark} />
      </div>
    </div>
  );
}
