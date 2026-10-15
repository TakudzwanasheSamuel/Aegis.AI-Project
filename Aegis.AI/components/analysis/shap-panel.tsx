'use client';

import { FileText } from 'lucide-react';

import { ShapBarChart } from '@/components/charts/shap-bar-chart';
import { Panel } from '@/components/ui-aegis';
import type { ShapImpact } from '@/lib/api';

interface ShapExplainabilityPanelProps {
  features: ShapImpact[];
  prediction: string;
  severity: string;
}

export function ShapExplainabilityPanel({
  features,
  prediction,
  severity,
}: ShapExplainabilityPanelProps) {
  const shapData = features.map((item) => ({
    feature: item.feature,
    value: item.impact,
  }));

  const topPositive = [...shapData]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const summary =
    topPositive.length > 0
      ? `The snapshot was labelled ${prediction} (${severity}) primarily due to ${topPositive
          .map((entry) => `${entry.feature} (${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(3)})`)
          .join(' and ')}.`
      : `The snapshot was labelled ${prediction} (${severity}). SHAP attributions are available above.`;

  return (
    <Panel
      title="SHAP Feature Attribution"
      description="TreeExplainer · Per-feature impact on the ransomware class"
    >
      {shapData.length === 0 ? (
        <p className="flex h-40 items-center justify-center text-sm text-aegis-muted">
          No SHAP vector stored for this assessment.
        </p>
      ) : (
        <ShapBarChart data={shapData} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-aegis-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-aegis-high" aria-hidden="true" />
          Increases ransomware risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-aegis-safe" aria-hidden="true" />
          Pulls toward benign
        </span>
      </div>

      <div className="mt-5 border-t border-aegis-rule pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-aegis-ink">
          <FileText className="h-4 w-4 text-aegis-muted" aria-hidden="true" />
          Automated Diagnostic Summary
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-aegis-ink-2">{summary}</p>
      </div>
    </Panel>
  );
}
