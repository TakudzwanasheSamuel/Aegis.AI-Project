'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { ApiResponsePanel } from '@/components/sandbox/api-response-panel';
import { LiveSimulationCard } from '@/components/sandbox/live-simulation-card';
import { ScenarioSelector } from '@/components/sandbox/scenario-selector';
import { TelemetrySliders } from '@/components/sandbox/telemetry-sliders';
import { TelemetryUpload } from '@/components/sandbox/telemetry-upload';
import {
  parseTelemetryFile,
  sendTelemetryToGateway,
} from '@/lib/sandbox/inference';
import { SANDBOX_SCENARIOS } from '@/lib/sandbox/scenarios';
import type { FastApiResponse, SandboxScenario, TelemetryPayload } from '@/lib/sandbox/types';
import { cn } from '@/lib/utils';
import { DEFAULT_TELEMETRY } from '@/lib/sandbox/types';

interface SandboxWorkspaceProps {
  onResetReady?: (reset: () => void) => void;
}

export function SandboxWorkspace({ onResetReady }: SandboxWorkspaceProps) {
  const [telemetry, setTelemetry] = useState<TelemetryPayload>(DEFAULT_TELEMETRY);
  const [response, setResponse] = useState<FastApiResponse | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [loadingScenarioId, setLoadingScenarioId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setTelemetry(DEFAULT_TELEMETRY);
    setResponse(null);
    setActiveScenarioId(null);
    setLoadingScenarioId(null);
    setSending(false);
    setUploading(false);
    setUploadError(null);
    setShowAdvanced(false);
  }, []);

  useEffect(() => {
    onResetReady?.(reset);
  }, [onResetReady, reset]);

  const dispatchTelemetry = useCallback(
    async (
      payload: TelemetryPayload,
      options?: {
        scenario?: SandboxScenario;
        source?: 'manual' | 'scenario' | 'upload';
        scenarioIdForLoading?: number;
      },
    ) => {
      const loadingId = options?.scenarioIdForLoading ?? null;
      if (loadingId) setLoadingScenarioId(loadingId);
      else setSending(true);

      setUploadError(null);

      try {
        setResponse(null);
        const result = await sendTelemetryToGateway(payload, {
          scenario_id: options?.scenario?.id,
        });
        setResponse(result);
        setTelemetry(payload);
        setActiveScenarioId(options?.scenario?.id ?? null);
        // On stacked (mobile/tablet) layouts, bring the verdict into view.
        if (!result.error && window.matchMedia('(max-width: 1279px)').matches) {
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.requestAnimationFrame(() =>
            resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }),
          );
        }
      } finally {
        setLoadingScenarioId(null);
        setSending(false);
        setUploading(false);
      }
    },
    [],
  );

  const handleLoadScenario = (scenario: SandboxScenario) => {
    dispatchTelemetry(scenario.telemetry, {
      scenario,
      source: 'scenario',
      scenarioIdForLoading: scenario.id,
    });
  };

  const handleSendManual = () => {
    dispatchTelemetry(telemetry, { source: 'manual' });
  };

  const handleFileLoaded = async (content: string, filename: string) => {
    setUploading(true);
    setUploadError(null);

    try {
      const parsed = parseTelemetryFile(content, filename);
      await dispatchTelemetry(parsed, { source: 'upload' });
    } catch (error) {
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : 'Failed to parse telemetry file.');
    }
  };

  const isLoading = sending || loadingScenarioId !== null || uploading;
  const activeScenario = SANDBOX_SCENARIOS.find((scenario) => scenario.id === activeScenarioId);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Input */}
      <div className="min-w-0 space-y-6">
        <ScenarioSelector
          scenarios={SANDBOX_SCENARIOS}
          activeScenarioId={activeScenarioId}
          loadingScenarioId={loadingScenarioId}
          onLoadScenario={handleLoadScenario}
        />

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((open) => !open)}
            aria-expanded={showAdvanced}
            aria-controls="sandbox-advanced-controls"
            className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-aegis-ink-2 underline-offset-4 hover:text-aegis-ink hover:underline"
          >
            {showAdvanced ? 'Hide advanced controls' : 'Show advanced controls'}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', showAdvanced && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          {showAdvanced && (
            <div id="sandbox-advanced-controls" className="mt-4 space-y-6">
              <TelemetrySliders
                telemetry={telemetry}
                onChange={setTelemetry}
                onSend={handleSendManual}
                sending={sending}
                onResetToScenario={
                  activeScenario ? () => setTelemetry(activeScenario.telemetry) : undefined
                }
              />
              <TelemetryUpload
                onFileLoaded={handleFileLoaded}
                uploading={uploading}
                error={uploadError}
                onClearError={() => setUploadError(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Result: sticky beside the inputs on wide screens */}
      <div
        ref={resultRef}
        className="min-w-0 scroll-mt-20 space-y-6 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pb-1"
      >
        <LiveSimulationCard />
        <ApiResponsePanel response={response} loading={isLoading} />
      </div>
    </div>
  );
}
