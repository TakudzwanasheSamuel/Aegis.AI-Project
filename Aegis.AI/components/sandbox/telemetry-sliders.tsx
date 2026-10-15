'use client';

import { Loader2, RotateCcw, Send } from 'lucide-react';

import { Panel, buttonClasses } from '@/components/ui-aegis';
import { Slider } from '@/components/ui/slider';
import {
  TELEMETRY_SLIDER_CONFIG,
  type NumericTelemetryKey,
  type TelemetryPayload,
} from '@/lib/sandbox/types';
import { cn } from '@/lib/utils';

interface TelemetrySlidersProps {
  telemetry: TelemetryPayload;
  onChange: (telemetry: TelemetryPayload) => void;
  onSend: () => void;
  sending: boolean;
  /** Restores the selected scenario's own values; omitted when no scenario is selected. */
  onResetToScenario?: () => void;
}

const FIELD =
  'h-9 w-full rounded-md border border-aegis-rule bg-aegis-surface px-3 text-sm text-aegis-ink focus-visible:border-aegis-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aegis-accent';

export function TelemetrySliders({
  telemetry,
  onChange,
  onSend,
  sending,
  onResetToScenario,
}: TelemetrySlidersProps) {
  const updateNumeric = (key: NumericTelemetryKey, value: number) => {
    onChange({ ...telemetry, [key]: value });
  };

  return (
    <Panel
      title="Advanced Telemetry Tweak Panel"
      description="Edit live TelemetryPayload fields, then POST to FastAPI /api/v1/telemetry/assess"
      meta={
        onResetToScenario ? (
          <button
            type="button"
            onClick={onResetToScenario}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-aegis-accent underline-offset-4 hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset to scenario
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-aegis-muted">Hostname</span>
          <input
            value={telemetry.hostname}
            onChange={(event) => onChange({ ...telemetry, hostname: event.target.value })}
            className={cn(FIELD, 'font-mono')}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-aegis-muted">Snapshot label</span>
          <input
            value={telemetry.snapshot_label}
            onChange={(event) => onChange({ ...telemetry, snapshot_label: event.target.value })}
            className={cn(FIELD, 'font-mono')}
          />
        </label>
      </div>

      <div className="mt-6 divide-y divide-aegis-rule">
        {TELEMETRY_SLIDER_CONFIG.map((config) => {
          const value = telemetry[config.key];
          const inputId = `telemetry-${config.key}`;
          const unitSuffix = config.unit === '%' ? '%' : config.unit ? ` ${config.unit}` : '';

          return (
            <div key={config.key} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor={inputId} className="min-w-0 truncate font-mono text-xs text-aegis-ink-2">
                  {config.label}
                </label>
                <span className="flex items-center gap-1">
                  <input
                    id={inputId}
                    type="number"
                    inputMode="decimal"
                    value={value}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onChange={(event) => {
                      const next = event.target.valueAsNumber;
                      if (!Number.isNaN(next)) updateNumeric(config.key, next);
                    }}
                    className="h-8 w-28 rounded-md border border-aegis-rule bg-aegis-surface px-2 text-right font-mono text-sm tabular-nums text-aegis-ink focus-visible:border-aegis-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aegis-accent"
                  />
                  {unitSuffix && <span className="text-xs text-aegis-muted">{unitSuffix.trim()}</span>}
                </span>
              </div>
              <Slider
                value={[value]}
                min={config.min}
                max={config.max}
                step={config.step}
                onValueChange={([next]) => updateNumeric(config.key, next)}
                aria-label={config.label}
              />
              <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-aegis-muted">
                <span>
                  {config.min}
                  {unitSuffix}
                </span>
                <span>
                  {config.max}
                  {unitSuffix}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={buttonClasses('primary', 'md', 'mt-6 h-10 w-full')}
        disabled={sending}
        aria-busy={sending}
        onClick={onSend}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {sending ? 'Dispatching Telemetry…' : 'Send Telemetry to FastAPI Gateway'}
      </button>
    </Panel>
  );
}
