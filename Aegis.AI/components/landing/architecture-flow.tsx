'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { transition } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  tech: string;
  details: string[];
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: 'Endpoint Agent',
    subtitle: 'One system-wide snapshot',
    tech: 'Python · psutil',
    details: [
      'Reads accessible Windows processes with psutil',
      'Aggregates them into eight system-wide indicators',
      'POSTs the snapshot to FastAPI. No command channel returns to the host',
    ],
  },
  {
    id: 2,
    title: 'FastAPI Backend',
    subtitle: 'Harmonization + RF/XGBoost + SHAP',
    tech: 'FastAPI · scikit-learn · SHAP',
    details: [
      'Passes the eight indicators through the Feature Harmonization Layer',
      'Scores the vector with Random Forest and XGBoost',
      'Explains the classification with TreeExplainer SHAP',
    ],
  },
  {
    id: 3,
    title: 'SQLite',
    subtitle: 'assessment_records',
    tech: 'SQLAlchemy · SQLite',
    details: [
      'Stores the classification, risk score, and severity',
      'Stores the harmonized vector and top SHAP impacts',
      'Stores the decision-support recommendation text',
    ],
  },
  {
    id: 4,
    title: 'Next.js Dashboard',
    subtitle: 'Decision-support console',
    tech: 'Next.js · Recharts',
    details: [
      'Reads classifications, SHAP charts, and recommendations',
      'Does not send isolate, kill, or stop commands to the endpoint',
      'Flow is one way: agent to API to database to dashboard',
    ],
  },
];

const PANEL_ID = 'architecture-stage-detail';

export function ArchitectureFlow() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <div>
      {/* Pipeline: vertical list on mobile, stepped row on desktop */}
      <ol className="grid lg:grid-cols-4">
        {STAGES.map((s, idx) => {
          const isActive = idx === active;
          const isLast = idx === STAGES.length - 1;
          return (
            <li key={s.id} className={cn('relative', !isLast && 'pb-6 lg:pb-0')}>
              {!isLast && (
                <>
                  {/* Connector to the next stage, with packets travelling one way along it */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-4 top-9 w-px bg-aegis-rule lg:hidden"
                  >
                    <span
                      className="packet-y absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aegis-accent"
                      style={{ animationDelay: `${idx * 0.8}s` }}
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute left-12 right-3 top-4 hidden h-px bg-aegis-rule lg:block"
                  >
                    <span
                      className="packet-x absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aegis-accent"
                      style={{ animationDelay: `${idx * 0.8}s` }}
                    />
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => setActive(idx)}
                aria-pressed={isActive}
                aria-controls={PANEL_ID}
                className="group relative flex w-full items-start gap-3 rounded-md text-left lg:flex-col lg:pr-6"
              >
                <span
                  className={cn(
                    'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aegis-paper font-mono text-sm tabular-nums transition-colors',
                    isActive
                      ? 'border-2 border-aegis-accent font-medium text-aegis-accent'
                      : 'border border-aegis-rule text-aegis-muted group-hover:border-aegis-muted group-hover:text-aegis-ink',
                  )}
                >
                  {/* Soft accent ring that animates to the selected stage */}
                  {isActive && (
                    <motion.span
                      layoutId="architecture-stage-ring"
                      aria-hidden="true"
                      className="absolute -inset-1.5 rounded-full ring-4 ring-aegis-accent/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {s.id}
                </span>
                <span className="min-w-0 pt-1 lg:pt-0">
                  <span
                    className={cn(
                      'block text-sm font-semibold transition-colors',
                      isActive ? 'text-aegis-accent' : 'text-aegis-ink group-hover:text-aegis-accent',
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-aegis-muted">{s.subtitle}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Detail panel */}
      <div
        id={PANEL_ID}
        aria-live="polite"
        className="mt-8 rounded-md border border-aegis-rule bg-aegis-surface p-5 sm:p-6"
      >
        {/* Content crossfades when the selected stage changes */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fast}
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="text-lg text-aegis-ink">{stage.title}</h3>
              <span className="font-mono text-xs text-aegis-muted">{stage.tech}</span>
            </div>
            <p className="mt-1 text-sm text-aegis-muted">{stage.subtitle}</p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-aegis-ink-2 marker:text-aegis-muted">
              {stage.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
