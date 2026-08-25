'use client';

import { useCallback, useEffect, useState } from 'react';

import { ApiResponsePanel } from '@/components/sandbox/api-response-panel';
import { ScenarioSelector } from '@/components/sandbox/scenario-selector';
import { TelemetrySliders } from '@/components/sandbox/telemetry-sliders';
import { TelemetryUpload } from '@/components/sandbox/telemetry-upload';
import {
  parseTelemetryFile,
  sendTelemetryToGateway,
} from '@/lib/sandbox/inference';
import { SANDBOX_SCENARIOS } from '@/lib/sandbox/scenarios';
import type { FastApiResponse, SandboxScenario, TelemetryPayload } from '@/lib/sandbox/types';
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

  const reset = useCallback(() => {
    setTelemetry(DEFAULT_TELEMETRY);
    setResponse(null);
    setActiveScenarioId(null);
    setLoadingScenarioId(null);
    setSending(false);
    setUploading(false);
    setUploadError(null);
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

  return (
    <div className="space-y-6">
      <ScenarioSelector
        scenarios={SANDBOX_SCENARIOS}
        activeScenarioId={activeScenarioId}
        loadingScenarioId={loadingScenarioId}
        onLoadScenario={handleLoadScenario}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <TelemetrySliders
            telemetry={telemetry}
            onChange={setTelemetry}
            onSend={handleSendManual}
            sending={sending}
          />
          <TelemetryUpload
            onFileLoaded={handleFileLoaded}
            uploading={uploading}
            error={uploadError}
            onClearError={() => setUploadError(null)}
          />
        </div>

        <ApiResponsePanel response={response} loading={isLoading} />
      </div>
    </div>
  );
}
