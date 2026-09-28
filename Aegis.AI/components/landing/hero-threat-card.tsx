'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Zap, TrendingDown } from 'lucide-react';

const STAGES = [
  { label: 'Critical', color: '#DC2626', pct: 92 },
  { label: 'High', color: '#EF4444', pct: 78 },
  { label: 'Elevated', color: '#F59E0B', pct: 58 },
  { label: 'Moderate', color: '#3B82F6', pct: 38 },
  { label: 'Safe', color: '#10B981', pct: 8 },
] as const;

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

export function HeroThreatCard() {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const stage = STAGES[stageIdx];
  const shapFeatures = attributionsForStage(stageIdx);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (stage.pct / 100) * circumference;

  return (
    <div className="glass-panel relative w-full max-w-md rounded-card p-6 shadow-glow-primary">
      {/* Floating accent */}
      <div className="pointer-events-none absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-aegis-accent-secondary/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-success opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-aegis-success" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-aegis-text-secondary">
            Illustrative Risk Gauge
          </span>
        </div>
        <span className="text-[10px] font-medium text-aegis-text-muted">
          8-feature RF + XGBoost
        </span>
      </div>

      {/* Gauge */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={stage.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 1.8s ease-in-out, stroke 1.8s ease-in-out',
                filter: `drop-shadow(0 0 8px ${stage.color}80)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold tabular-nums transition-colors duration-700"
              style={{ color: stage.color }}
            >
              {stage.pct}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-aegis-text-muted">
              Threat Score
            </span>
          </div>
        </div>
        <div
          className="mt-3 flex items-center gap-2 rounded-full px-3 py-1 transition-colors duration-700"
          style={{ backgroundColor: `${stage.color}1a` }}
        >
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: stage.color }} />
          <span
            className="text-xs font-semibold transition-colors duration-700"
            style={{ color: stage.color }}
          >
            {stage.label}
          </span>
          <TrendingDown className="h-3 w-3 text-aegis-success" />
        </div>
      </div>

      {/* SHAP snippet */}
      <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-aegis-accent-secondary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-aegis-text-secondary">
              SHAP Feature Attribution
            </span>
          </div>
          <span className="text-[10px] text-aegis-text-muted">8 indicators</span>
        </div>
        <div className="mt-3 space-y-2">
          {shapFeatures.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <span className="w-44 shrink-0 truncate text-[10px] font-mono text-aegis-text-muted">
                {f.name}
              </span>
              <div className="relative h-1.5 flex-1 rounded-full bg-white/[0.04]">
                <div
                  className="absolute top-0 h-1.5 rounded-full"
                  style={{
                    left: f.dir === 'down' ? 'auto' : '50%',
                    right: f.dir === 'up' ? 'auto' : '50%',
                    width: `${Math.abs(f.value) * 120}px`,
                    backgroundColor:
                      f.dir === 'up' ? '#EF4444' : '#10B981',
                  }}
                />
                <div className="absolute left-1/2 top-0 h-1.5 w-px bg-white/20" />
              </div>
              <span
                className={`w-10 text-right text-[10px] tabular-nums font-mono ${
                  f.dir === 'up' ? 'text-aegis-danger' : 'text-aegis-success'
                }`}
              >
                {f.value > 0 ? '+' : ''}
                {f.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-aegis-text-muted">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-aegis-accent-secondary" />
          Illustrative only
        </span>
        <span>RF + XGBoost ensemble</span>
        <span>TreeExplainer</span>
      </div>
    </div>
  );
}
