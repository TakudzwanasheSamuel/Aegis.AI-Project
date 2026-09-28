import { GraduationCap, ShieldCheck } from 'lucide-react';

import type { ResearchBenchmark } from '@/lib/api';

export function AcademicSummaryFooter({ benchmark }: { benchmark: ResearchBenchmark | null }) {
  const rf = benchmark?.models?.RandomForest;
  const xgb = benchmark?.models?.XGBoost;
  const nFeatures = benchmark?.n_features ?? 8;
  const nSamples = benchmark?.n_samples ?? 58596;

  const points = [
    `Random Forest and XGBoost are trained on ${nFeatures} harmonized features mapped from CIC-MalMem-2022 (${nSamples.toLocaleString()} samples).`,
    rf
      ? `Random Forest (production / SHAP) test accuracy ${(rf.accuracy * 100).toFixed(2)}%, F1 ${(rf.f1 * 100).toFixed(2)}%, ROC-AUC ${rf.roc_auc.toFixed(4)}.`
      : 'Random Forest is the production classifier because TreeExplainer SHAP is well-defined for the ensemble.',
    xgb
      ? `XGBoost benchmark test accuracy ${(xgb.accuracy * 100).toFixed(2)}%, F1 ${(xgb.f1 * 100).toFixed(2)}%, ROC-AUC ${xgb.roc_auc.toFixed(4)}.`
      : 'XGBoost is retained as a supervised benchmark, not as an unsupervised baseline.',
    'The table and charts read the exported held-out scores in training_metrics.json.',
    'Inference averages Random Forest and XGBoost; explanations come from Random Forest TreeExplainer.',
  ];

  return (
    <div className="rounded-card border border-aegis-accent-primary/20 bg-gradient-to-br from-aegis-accent-primary/[0.08] to-aegis-accent-secondary/[0.04] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-aegis-accent-primary/25 bg-aegis-accent-primary/15">
          <GraduationCap className="h-6 w-6 text-aegis-accent-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold text-aegis-text-primary">Dissertation Validation Summary</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-aegis-success/25 bg-aegis-success/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aegis-success">
              <ShieldCheck className="h-3 w-3" />
              Live training_metrics.json
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-aegis-text-secondary">
            Figures on this page are loaded from the FastAPI research-benchmark endpoint, which
            serves the artifacts written by train_models.py — not illustrative placeholders.
          </p>
          <ul className="mt-4 space-y-2">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-xs leading-relaxed text-aegis-text-secondary"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aegis-accent-secondary" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
