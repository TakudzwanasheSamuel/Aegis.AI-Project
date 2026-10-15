'use client';

import { DataTable, Panel, THead, Td, Th, Tr } from '@/components/ui-aegis';
import type { AssessmentRecord } from '@/lib/api';
import { buildHarmonizationRows } from '@/lib/analysis/harmonization';

export function FeatureHarmonizationTable({ record }: { record: AssessmentRecord }) {
  const rows = buildHarmonizationRows(record);

  return (
    <Panel
      title="Feature Harmonization Mapping"
      description="Live psutil telemetry projected onto the 8 CIC-MalMem-2022 forensic features"
      flush
    >
      <DataTable label="Feature Harmonization Mapping">
        <THead>
          <tr>
            <Th>Indicator</Th>
            <Th align="right">Value</Th>
          </tr>
        </THead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.key}>
              <Td className="font-mono text-xs text-aegis-ink">{row.key}</Td>
              <Td numeric className="text-xs">{row.value}</Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>

      <p className="border-t border-aegis-rule px-5 py-3 text-xs leading-relaxed text-aegis-muted">
        The Feature Harmonization Layer aggregates live per-process measurements into system-wide indicators that match the CIC-MalMem-2022 feature definitions.
      </p>
    </Panel>
  );
}
