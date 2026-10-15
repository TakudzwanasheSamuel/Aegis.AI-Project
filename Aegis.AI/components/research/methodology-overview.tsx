'use client';

import { Database, FlaskConical, Layers } from 'lucide-react';

import { Panel } from '@/components/ui-aegis';
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
  const benign = benchmark?.class_distribution?.benign;
  const malware = benchmark?.class_distribution?.malware;
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
        `Mapped from ${benchmark?.dataset ?? 'CIC-MalMem-2022'} (${nSamples.toLocaleString()} samples)`,
        'process, thread, handle and DLL counts aggregated system-wide across all accessible processes.',
        'Live psutil telemetry projected onto this 8-column space',
      ],
      icon: 'features' as const,
    },
    {
      title: 'Validation Strategy',
      headline: 'Held-out test evaluation',
      details: [
        'Held-out test metrics from training_metrics.json',
        benchmark?.scaler ?? 'Tree models',
      ],
      icon: 'validation' as const,
    },
  ];

  return (
    <Panel as="div" flush>
      <div className="grid divide-y divide-aegis-rule md:grid-cols-3 md:divide-x md:divide-y-0">
        {cards.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <section key={card.title} className="min-w-0 p-5">
              <p className="flex items-center gap-2 text-sm text-aegis-muted">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {card.title}
              </p>
              <h2 className="mt-1.5 font-sans text-base font-semibold tracking-normal text-aegis-ink">
                {card.headline}
              </h2>
              <ul className="mt-3 space-y-1.5">
                {card.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2 text-sm leading-relaxed text-aegis-ink-2"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aegis-muted" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}

export function RoleBadge({ role }: { role: 'primary' | 'benchmark' | 'baseline' }) {
  const styles = {
    primary: 'border-aegis-accent/50 text-aegis-accent',
    benchmark: 'border-aegis-rule text-aegis-ink-2',
    baseline: 'border-aegis-rule text-aegis-muted',
  };

  const labels = {
    primary: 'Primary',
    benchmark: 'Benchmark',
    baseline: 'Baseline',
  };

  return (
    <span
      className={cn(
        'ml-2 inline-flex rounded-sm border px-1.5 py-px text-xs font-medium leading-4',
        styles[role],
      )}
    >
      {labels[role]}
    </span>
  );
}
