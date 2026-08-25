'use client';

import { useCallback, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SandboxWorkspace } from '@/components/sandbox/sandbox-workspace';
import { RotateCcw, Terminal } from 'lucide-react';

export default function SandboxPage() {
  const resetRef = useRef<(() => void) | null>(null);

  const handleResetReady = useCallback((reset: () => void) => {
    resetRef.current = reset;
  }, []);

  return (
    <div>
      <PageHeader
        title="Scenario Sandbox"
        subtitle="Live viva demonstrations against FastAPI /assess — RF + XGBoost inference with SHAP, no live malware required."
        icon={<Terminal className="h-6 w-6 text-aegis-accent-secondary" />}
        actions={
          <button
            type="button"
            onClick={() => resetRef.current?.()}
            className="flex items-center gap-2 rounded-button border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-aegis-text-secondary transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        }
      />

      <SandboxWorkspace onResetReady={handleResetReady} />
    </div>
  );
}
