'use client';

import { useCallback, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SandboxWorkspace } from '@/components/sandbox/sandbox-workspace';
import { RotateCcw, Terminal } from 'lucide-react';

import { buttonClasses } from '@/components/ui-aegis/button';

export default function SandboxPage() {
  const resetRef = useRef<(() => void) | null>(null);

  const handleResetReady = useCallback((reset: () => void) => {
    resetRef.current = reset;
  }, []);

  return (
    <div>
      <PageHeader
        title="Scenario Sandbox"
        subtitle="Start a live simulation or load a scenario, then watch the verdict."
        icon={<Terminal />}
        actions={
          <button
            type="button"
            onClick={() => resetRef.current?.()}
            className={buttonClasses('secondary')}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        }
      />

      <SandboxWorkspace onResetReady={handleResetReady} />
    </div>
  );
}
