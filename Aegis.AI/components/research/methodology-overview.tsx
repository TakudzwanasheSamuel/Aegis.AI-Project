'use client';

import { Database, FlaskConical, Layers } from 'lucide-react';

import type { ResearchBenchmark } from '@/lib/api';
import { cn } from '@/lib/utils';

const ICONS = {
  dataset: Database,
  features: Layers,
  validation: FlaskConical,
} as const;

export function MethodologyOverview({ benchmark }: { benchmark: ResearchBenchmark | null }) {
  const nSamples = benchmark?.n_samples ?? 58596;
  const nFeatures = benchmark?.n_features ?? 8;
  const benign = benchmark?.class_counts?.benign;
  const malware = benchmark?.class_counts?.malware;
  const split =
    benign != null && malware != null
      ? `${((benign / nSamples) * 100).toFixed(0)}% Benign / ${((malware / nSamples) * 100).toFixed(0)}% Malware`
      : '50% Benign / 50% Malware';

  const cards = [
    {
      title: 'Benchmark Dataset',
      headline: benchmark?.dataset ?? 'CIC-MalMem-2022',
      details: [
        `${nSamples.toLocaleString()} total memory dump samples`,
        split,
        'Canadian Institute for Cybersecurity (CIC) corpus',
      ],
      icon: 'dataset' as const,
    },
    {
      title: 'Feature Matrix',
      headline: `${nFeatures} Harmonized Features`,
      details: [
        'Mapped from CIC-MalMem-2022 (58,596 samples)',
        'handles, threads, DLLs, malfind, services, ldrmodules',
        'Live psutil telemetry projected onto this 8-column space',
      ],
      icon: 'features' as const,
    },
    {
      title: 'Validation Strategy',
      headline: 'Held-out test evaluation',
      details: [
        `${Math.round((1 - (benchmark?.test_size ?? 0.2)) * 100)}/${Math.round((benchmark?.test_size ?? 0.2) * 100)} Train/Test Split`,
        benchmark?.smote ? 'SMOTE applied on the training fold' : 'No SMOTE',
        `${benchmark?.scaler ?? 'StandardScaler'} before RF + XGBoost`,
      ],
      icon: 'validation' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = ICONS[card.icon];
        return (
          <div key={card.title} className="surface-card rounded-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-aegis-accent-primary/20 bg-aegis-accent-primary/10">
                <Icon className="h-5 w-5 text-aegis-accent-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                  {card.title}
                </p>
                <h3 className="mt-1 text-base font-semibold text-aegis-text-primary">{card.headline}</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {card.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-2 text-xs leading-relaxed text-aegis-text-secondary"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aegis-accent-secondary" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function RoleBadge({ role }: { role: 'primary' | 'benchmark' | 'baseline' }) {
  const styles = {
    primary: 'bg-aegis-accent-primary/10 text-aegis-accent-primary border-aegis-accent-primary/20',
    benchmark: 'bg-aegis-accent-secondary/10 text-aegis-accent-secondary border-aegis-accent-secondary/20',
    baseline: 'bg-aegis-text-muted/10 text-aegis-text-muted border-white/[0.08]',
  };

  const labels = {
    primary: 'Primary',
    benchmark: 'Benchmark',
    baseline: 'Baseline',
  };

  return (
    <span
      className={cn(
        'ml-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
        styles[role],
      )}
    >
      {labels[role]}
    </span>
  );
}
