'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

import { ShapDetailModal } from '@/components/history/shap-detail-modal';
import { DataTable, Panel, RiskBar, SeverityBadge, Skeleton, THead, Td, Th, Tr } from '@/components/ui-aegis';
import { buttonClasses } from '@/components/ui-aegis/button';
import type { HistoricalIncident, Severity } from '@/lib/history/types';

interface IncidentLogTableProps {
  incidents: HistoricalIncident[];
  /** Pagination row rendered under the table, inside the panel. */
  footer?: React.ReactNode;
  /** First fetch still in flight: show shimmer rows instead of the empty state. */
  loading?: boolean;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  Safe: 'Safe',
  Moderate: 'Moderate',
  High: 'High Risk',
  Critical: 'Critical',
};

const HEADERS: { label: string; align?: 'right' }[] = [
  { label: 'Timestamp' },
  { label: 'Endpoint ID' },
  { label: 'Snapshot' },
  { label: 'Risk Score', align: 'right' },
  { label: 'Classification Tag' },
  { label: 'SHAP Top Contributor' },
  { label: 'Action Taken' },
];

export function IncidentLogTable({ incidents, footer, loading = false }: IncidentLogTableProps) {
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetails = (incident: HistoricalIncident) => {
    setSelectedIncident(incident);
    setModalOpen(true);
  };

  return (
    <>
      <Panel
        title="Historical Incident Log"
        description="Persisted SQLite assessments · SHAP vectors stored with each record"
        flush
      >
        <DataTable minWidth="min-w-[1080px]" label="Historical Incident Log">
          <THead>
            <tr>
              {HEADERS.map((header) => (
                <Th key={header.label} align={header.align}>
                  {header.label}
                </Th>
              ))}
              <Th>
                <span className="sr-only">Details</span>
              </Th>
            </tr>
          </THead>
          <tbody>
            {incidents.length === 0 && loading ? (
              [0, 1, 2, 3, 4].map((row) => (
                <tr key={row} className="border-b border-aegis-rule last:border-b-0" aria-hidden="true">
                  {HEADERS.map((header) => (
                    <Td key={header.label}>
                      <Skeleton className="h-4 w-24" />
                    </Td>
                  ))}
                  <Td />
                </tr>
              ))
            ) : incidents.length === 0 ? (
              <tr>
                <Td colSpan={8} align="center" className="h-28 text-aegis-muted">
                  No incidents match the current filters.
                </Td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <Tr key={inc.id}>
                  <Td className="whitespace-nowrap font-mono text-xs tabular-nums text-aegis-ink-2">
                    {format(new Date(inc.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </Td>
                  <Td className="font-mono text-xs text-aegis-ink-2">{inc.endpointId}</Td>
                  <Td className="font-medium">{inc.snapshot_label}</Td>
                  <Td align="right">
                    <RiskBar risk={inc.riskScore} />
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <SeverityBadge severity={SEVERITY_LABEL[inc.severity]} />
                      <span className="text-xs text-aegis-muted">{inc.classification}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{inc.shapTopContributor}</Td>
                  <Td className="min-w-[16rem] max-w-md text-xs leading-relaxed text-aegis-muted">
                    {inc.actionTaken}
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      className={buttonClasses('secondary', 'sm', 'px-2.5 text-xs')}
                      onClick={() => openDetails(inc)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View Details
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </DataTable>
        {footer && <div className="border-t border-aegis-rule">{footer}</div>}
      </Panel>

      <ShapDetailModal
        incident={selectedIncident}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
