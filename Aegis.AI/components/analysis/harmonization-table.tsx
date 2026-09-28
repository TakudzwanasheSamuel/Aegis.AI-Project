'use client';

import { Layers } from 'lucide-react';

import type { AssessmentRecord } from '@/lib/api';
import { buildHarmonizationRows } from '@/lib/analysis/harmonization';

export function FeatureHarmonizationTable({ record }: { record: AssessmentRecord }) {
  const rows = buildHarmonizationRows(record);

  return (
    <div className="surface-card rounded-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-aegis-accent-secondary/20 bg-aegis-accent-secondary/10">
          <Layers className="h-5 w-5 text-aegis-accent-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">
            Feature Harmonization Mapping
          </h3>
          <p className="mt-0.5 text-xs text-aegis-text-muted">
            Live psutil telemetry projected onto the 8 CIC-MalMem-2022 forensic features
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Indicator
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-white/[0.04] transition-colors duration-300 hover:bg-white/[0.04]"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-aegis-text-primary">{row.key}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-semibold tabular-nums text-aegis-text-primary">
                    {row.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-3">
        <p className="text-[11px] text-aegis-text-muted">
          The Feature Harmonization Layer aggregates live per-process measurements into system-wide indicators that match the CIC-MalMem-2022 feature definitions.
        </p>
      </div>
    </div>
  );
}
