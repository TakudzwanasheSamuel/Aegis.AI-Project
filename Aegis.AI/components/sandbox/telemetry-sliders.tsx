'use client';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  TELEMETRY_SLIDER_CONFIG,
  type NumericTelemetryKey,
  type TelemetryPayload,
} from '@/lib/sandbox/types';

interface TelemetrySlidersProps {
  telemetry: TelemetryPayload;
  onChange: (telemetry: TelemetryPayload) => void;
  onSend: () => void;
  sending: boolean;
}

export function TelemetrySliders({
  telemetry,
  onChange,
  onSend,
  sending,
}: TelemetrySlidersProps) {
  const updateNumeric = (key: NumericTelemetryKey, value: number) => {
    onChange({ ...telemetry, [key]: value });
  };

  return (
    <div className="surface-card rounded-card p-6">
      <div>
        <h3 className="text-sm font-semibold text-aegis-text-primary">
          Advanced Telemetry Tweak Panel
        </h3>
        <p className="mt-0.5 text-xs text-aegis-text-muted">
          Edit live TelemetryPayload fields, then POST to FastAPI /api/v1/telemetry/assess
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
            Hostname
          </span>
          <Input
            value={telemetry.hostname}
            onChange={(event) => onChange({ ...telemetry, hostname: event.target.value })}
            className="h-9 border-white/[0.08] bg-white/[0.03] text-xs"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
            Process name
          </span>
          <Input
            value={telemetry.process_name}
            onChange={(event) => onChange({ ...telemetry, process_name: event.target.value })}
            className="h-9 border-white/[0.08] bg-white/[0.03] text-xs"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
            PID
          </span>
          <Input
            type="number"
            value={telemetry.pid}
            onChange={(event) =>
              onChange({ ...telemetry, pid: Number(event.target.value) || 0 })
            }
            className="h-9 border-white/[0.08] bg-white/[0.03] text-xs"
          />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        {TELEMETRY_SLIDER_CONFIG.map((config) => {
          const value = telemetry[config.key];
          const displayValue = config.unit
            ? `${value}${config.unit === '%' ? '%' : ` ${config.unit}`}`
            : String(value);

          return (
            <div key={config.key}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-aegis-text-secondary">
                  {config.label}
                </label>
                <span className="font-mono text-xs tabular-nums text-aegis-accent-secondary">
                  {displayValue}
                </span>
              </div>
              <Slider
                value={[value]}
                min={config.min}
                max={config.max}
                step={config.step}
                onValueChange={([next]) => updateNumeric(config.key, next)}
                className="[&_[data-radix-slider-track]]:h-1.5 [&_[data-radix-slider-track]]:bg-white/[0.06] [&_[data-radix-slider-range]]:bg-aegis-accent-primary [&_[data-radix-slider-thumb]]:h-4 [&_[data-radix-slider-thumb]]:w-4 [&_[data-radix-slider-thumb]]:border-aegis-accent-primary"
              />
              <div className="mt-1 flex justify-between text-[10px] text-aegis-text-muted">
                <span>
                  {config.min}
                  {config.unit === '%' ? '%' : config.unit ? ` ${config.unit}` : ''}
                </span>
                <span>
                  {config.max}
                  {config.unit === '%' ? '%' : config.unit ? ` ${config.unit}` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        className="btn-gradient mt-8 w-full gap-2 text-sm font-semibold text-white"
        disabled={sending}
        onClick={onSend}
      >
        <Send className="h-4 w-4" />
        {sending ? 'Dispatching Telemetry…' : 'Send Telemetry to FastAPI Gateway'}
      </Button>
    </div>
  );
}
