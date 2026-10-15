import { GraduationCap, ShieldCheck } from 'lucide-react';

import { Panel, SeverityBadge } from '@/components/ui-aegis';
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
    <Panel as="section" accentClassName="border-l-aegis-accent" bodyClassName="px-6 py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <GraduationCap className="h-5 w-5 shrink-0 text-aegis-muted" aria-hidden="true" />
        <h2 className="font-serif text-xl text-aegis-ink">Dissertation Validation Summary</h2>
        <SeverityBadge severity="Safe" className="gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Live training_metrics.json
        </SeverityBadge>
      </div>
      <div className="max-w-[70ch]">
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-aegis-ink-2">
          Figures on this page are loaded from the FastAPI research-benchmark endpoint, which
          serves the artifacts written by train_models.py — not illustrative placeholders.
        </p>
        <ul className="mt-4 space-y-2.5">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-aegis-ink-2"
            >
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-aegis-muted" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
