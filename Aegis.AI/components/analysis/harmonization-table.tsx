'use client';

import { ArrowRight, Layers } from 'lucide-react';

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
                Live Telemetry (psutil)
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Raw Value
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Mapping
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Forensic Feature
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                Harmonized Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.forensicFeature}
                className="border-b border-white/[0.04] transition-colors duration-300 hover:bg-white/[0.04]"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-aegis-accent-secondary">{row.psutilMetric}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-medium tabular-nums text-aegis-text-secondary">
                    {row.rawValue}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-aegis-text-muted" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-xs text-aegis-text-primary">{row.forensicFeature}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 rounded-full bg-white/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-aegis-accent-primary to-aegis-accent-secondary"
                        style={{ width: `${row.scale}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-aegis-text-primary">
                      {row.mappedValue}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-6 py-3">
        <p className="text-[11px] text-aegis-text-muted">
          Bars show interpolation between CIC benign and malware class centroids. Direct psutil
          counts are per-process; CIC features are system-wide dump statistics, so the layer
          projects intensity rather than copying raw values.
        </p>
      </div>
    </div>
  );
}
