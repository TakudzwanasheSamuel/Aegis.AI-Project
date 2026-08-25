import { Suspense } from 'react';

import { AnalysisWorkspace } from '@/components/analysis/analysis-workspace';

export default function AnalysisPage() {
  return (
    <Suspense fallback={<p className="text-sm text-aegis-text-muted">Loading analysis workspace…</p>}>
      <AnalysisWorkspace />
    </Suspense>
  );
}
