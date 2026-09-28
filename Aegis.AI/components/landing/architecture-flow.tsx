'use client';

import { useState } from 'react';
import {
  Monitor,
  Layers,
  Cpu,
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
    title: 'Endpoint Agent',
    subtitle: 'One system-wide snapshot',
    tech: 'Python · psutil',
    color: '#6366F1',
    details: [
      'Reads accessible Windows processes with psutil',
      'Aggregates them into eight system-wide indicators',
      'POSTs the snapshot to FastAPI. No command channel returns to the host',
    ],
  },
  {
    id: 2,
    icon: Cpu,
    title: 'FastAPI Backend',
    subtitle: 'Harmonization + RF/XGBoost + SHAP',
    tech: 'FastAPI · scikit-learn · SHAP',
    color: '#22D3EE',
    details: [
      'Passes the eight indicators through the Feature Harmonization Layer',
      'Scores the vector with Random Forest and XGBoost',
      'Explains the classification with TreeExplainer SHAP',
    ],
  },
  {
    id: 3,
    icon: Layers,
    title: 'SQLite',
    subtitle: 'assessment_records',
    tech: 'SQLAlchemy · SQLite',
    color: '#10B981',
    details: [
      'Stores the classification, risk score, and severity',
      'Stores the harmonized vector and top SHAP impacts',
      'Stores the decision-support recommendation text',
    ],
  },
  {
    id: 4,
    icon: LayoutDashboard,
    title: 'Next.js Dashboard',
    subtitle: 'Decision-support console',
    tech: 'Next.js · Recharts',
    color: '#F59E0B',
    details: [
      'Reads classifications, SHAP charts, and recommendations',
      'Does not send isolate, kill, or stop commands to the endpoint',
      'Flow is one way: agent to API to database to dashboard',
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
