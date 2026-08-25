'use client';

import { useState } from 'react';
import {
  Monitor,
  Layers,
  Cpu,
  BrainCircuit,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface Stage {
  id: number;
  icon: typeof Monitor;
  title: string;
  subtitle: string;
  tech: string;
  details: string[];
  color: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    icon: Monitor,
    title: 'Windows Endpoint Agent',
    subtitle: 'psutil Telemetry',
    tech: 'Python · psutil',
    color: '#6366F1',
    details: [
      'Collects 40+ process, memory, and disk metrics',
      'Lightweight background service (<1% CPU)',
      'Streams telemetry every 500ms',
    ],
  },
  {
    id: 2,
    icon: Layers,
    title: 'Feature Harmonization',
    subtitle: 'Dimension Mapping',
    tech: 'Custom Pipeline',
    color: '#818CF8',
    details: [
      'Maps psutil metrics to memory-forensic feature space',
      'Normalizes high-dimensional vectors in real time',
      'Bridges runtime telemetry with forensic signatures',
    ],
  },
  {
    id: 3,
    icon: Cpu,
    title: 'FastAPI ML Microservice',
    subtitle: 'RF & XGBoost Ensemble',
    tech: 'FastAPI · scikit-learn',
    color: '#22D3EE',
    details: [
      'Random Forest + XGBoost ensemble classifier',
      'Sub-second inference via async REST endpoints',
      'Containerized for horizontal scaling',
    ],
  },
  {
    id: 4,
    icon: BrainCircuit,
    title: 'SHAP Explainability',
    subtitle: 'Feature Attribution',
    tech: 'SHAP · TreeExplainer',
    color: '#10B981',
    details: [
      'TreeExplainer computes per-feature SHAP values',
      'Ranks contribution of each metric to the verdict',
      'Outputs human-readable threat rationale',
    ],
  },
  {
    id: 5,
    icon: LayoutDashboard,
    title: 'Decision Support Dashboard',
    subtitle: 'Next.js Console',
    tech: 'Next.js · Recharts',
    color: '#F59E0B',
    details: [
      'Visualizes threat score, SHAP charts, and trends',
      'Analyst-facing verdicts with full audit trail',
      'Real-time alerts and historical replay',
    ],
  },
];

export function ArchitectureFlow() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <div>
      {/* Pipeline */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === active;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-3 lg:flex-col">
              <button
                onClick={() => setActive(idx)}
                className={`group relative flex w-full flex-col items-center gap-3 rounded-card border p-4 transition-all duration-300 lg:flex-1 ${
                  isActive
                    ? 'border-white/[0.12] bg-white/[0.05] shadow-glow-primary'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform"
                  style={{
                    backgroundColor: `${s.color}1a`,
                    border: `1px solid ${s.color}30`,
                  }}
                >
                  <Icon
                    className="h-5 w-5 transition-colors"
                    style={{ color: isActive ? s.color : '#94A3B8' }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-semibold transition-colors ${
                      isActive ? 'text-white' : 'text-aegis-text-secondary'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-aegis-text-muted">
                    {s.subtitle}
                  </p>
                </div>
                <span
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.id}
                </span>
              </button>

              {/* Connector arrow */}
              {idx < STAGES.length - 1 && (
                <div className="flex items-center justify-center lg:px-1">
                  <ArrowRight className="h-4 w-4 shrink-0 text-aegis-text-muted lg:rotate-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="mt-6 surface-card rounded-card p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${stage.color}1a`,
              border: `1px solid ${stage.color}30`,
            }}
          >
            <stage.icon className="h-6 w-6" style={{ color: stage.color }} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-aegis-text-primary">
                {stage.title}
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${stage.color}1a`,
                  color: stage.color,
                }}
              >
                {stage.tech}
              </span>
            </div>
            <p className="mt-1 text-sm text-aegis-text-muted">{stage.subtitle}</p>
            <ul className="mt-4 space-y-2">
              {stage.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: stage.color }}
                  />
                  <span className="text-sm text-aegis-text-secondary">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
