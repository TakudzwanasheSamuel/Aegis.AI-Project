'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { RiskGauge } from '@/components/ui-aegis/risk-gauge';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Five illustrative stages drawn from the four-step severity palette.
const STAGES = [
  { label: 'Critical', pct: 92, text: 'text-aegis-critical' },
  { label: 'High', pct: 78, text: 'text-aegis-high' },
  { label: 'Elevated', pct: 58, text: 'text-aegis-moderate' },
  { label: 'Moderate', pct: 38, text: 'text-aegis-moderate' },
  { label: 'Safe', pct: 8, text: 'text-aegis-safe' },
] as const;

const DEFAULT_STAGE = 1; // High, 78

const INDICATORS = [
  'pslist.nproc',
  'pslist.nppid',
  'pslist.avg_threads',
  'pslist.avg_handlers',
  'dlllist.ndlls',
  'dlllist.avg_dlls_per_proc',
  'handles.nhandles',
  'handles.avg_handles_per_proc',
] as const;

function attributionsForStage(stageIdx: number) {
  const weight = STAGES[stageIdx].pct / 100;
  return INDICATORS.map((name, index) => {
    const towardMalware = (index + stageIdx) % 3 !== 0;
    const magnitude = 0.04 + ((index + 1) % 4) * 0.05 * weight;
    const value = Number((towardMalware ? magnitude : -magnitude * 0.6).toFixed(2));
    return { name, value, dir: value >= 0 ? ('up' as const) : ('down' as const) };
  });
}

// |SHAP| of 0.2 fills one half of the track.
const HALF_TRACK_VALUE = 0.2;

export function HeroThreatCard() {
  const [stageIdx, setStageIdx] = useState(DEFAULT_STAGE);

  const stage = STAGES[stageIdx];
  const shapFeatures = attributionsForStage(stageIdx);

  return (
    <figure className="w-full max-w-md rounded-md border border-aegis-rule bg-aegis-surface">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-aegis-rule px-5 py-3">
        <span className="text-sm font-semibold text-aegis-ink">Illustrative Risk Gauge</span>
        <span className="font-mono text-xs text-aegis-muted">8-feature RF + XGBoost</span>
      </div>

      <div className="px-4 pb-5 pt-4 sm:px-5">
        {/* Stage selector */}
        <div
          role="group"
          aria-label="Risk stage"
          className="flex w-full flex-wrap gap-0.5 rounded-md border border-aegis-rule bg-aegis-sunken p-0.5"
        >
          {STAGES.map((s, idx) => {
            const isActive = idx === stageIdx;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setStageIdx(idx)}
                aria-pressed={isActive}
                className={cn(
                  'flex-auto rounded-sm px-1.5 py-1 text-xs transition-[color,transform] active:scale-[0.98]',
                  isActive ? 'seg-active font-semibold' : 'font-medium text-aegis-muted hover:text-aegis-ink',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Gauge */}
        <div className="mt-5 flex flex-col items-center">
          <RiskGauge value={stage.pct} label="Threat Score" />
          <span className={cn('mt-2 text-sm font-semibold', stage.text)}>{stage.label}</span>
        </div>

        {/* SHAP snippet */}
        <div className="mt-5 border-t border-aegis-rule pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-aegis-ink">SHAP Feature Attribution</span>
            <span className="text-xs text-aegis-muted">8 indicators</span>
          </div>
          <ul className="mt-3 space-y-2">
            {shapFeatures.map((f, index) => (
              <li
                key={f.name}
                className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[12.75rem_minmax(0,1fr)_3rem]"
              >
                <span className="col-span-2 truncate font-mono text-xs text-aegis-ink-2 sm:col-span-1">
                  {f.name}
                </span>
                <span className="relative h-2" aria-hidden="true">
                  {/* Bars grow out of the zero line, 30ms apart; keyed on the stage so they replay. */}
                  <motion.span
                    key={`${stageIdx}-${f.name}`}
                    className={cn(
                      'absolute inset-y-0',
                      f.dir === 'up' ? 'left-1/2 bg-aegis-high' : 'right-1/2 bg-aegis-safe',
                    )}
                    style={{
                      width: `${Math.min(50, (Math.abs(f.value) / HALF_TRACK_VALUE) * 50)}%`,
                      originX: f.dir === 'up' ? 0 : 1,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.45, ease: EASE, delay: index * 0.03 }}
                  />
                  <span className="absolute -inset-y-0.5 left-1/2 w-px bg-aegis-rule" />
                </span>
                <span
                  className={cn(
                    'text-right font-mono text-xs tabular-nums',
                    f.dir === 'up' ? 'text-aegis-high' : 'text-aegis-safe',
                  )}
                >
                  {f.value > 0 ? '+' : ''}
                  {f.value.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-aegis-rule px-5 py-2.5 text-xs text-aegis-muted">
        <span>Illustrative only</span>
        <span>RF + XGBoost ensemble</span>
        <span>TreeExplainer</span>
      </figcaption>
    </figure>
  );
}
