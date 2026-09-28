'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

import { ShapDetailModal } from '@/components/history/shap-detail-modal';
import { Button } from '@/components/ui/button';
import type { HistoricalIncident, Severity } from '@/lib/history/types';
import { cn } from '@/lib/utils';

interface IncidentLogTableProps {
  incidents: HistoricalIncident[];
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const config: Record<Severity, { emoji: string; label: string; className: string }> = {
    Safe: {
      emoji: '🟢',
      label: 'Safe',
      className: 'bg-aegis-success/10 text-aegis-success border-aegis-success/20',
    },
    Moderate: {
      emoji: '🟡',
      label: 'Moderate',
      className: 'bg-aegis-warning/10 text-aegis-warning border-aegis-warning/20',
    },
    High: {
      emoji: '🔴',
      label: 'High Risk',
      className: 'bg-aegis-danger/10 text-aegis-danger border-aegis-danger/20',
    },
    Critical: {
      emoji: '🔴',
      label: 'Critical',
      className: 'bg-aegis-critical/10 text-aegis-critical border-aegis-critical/30',
    },
  };

  const { emoji, label, className } = config[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        className,
      )}
    >
      <span>{emoji}</span>
      {label}
    </span>
  );
}

function RiskScoreCell({ score }: { score: number }) {
  const color = score >= 70 ? '#EF4444' : score >= 25 ? '#F59E0B' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export function IncidentLogTable({ incidents }: IncidentLogTableProps) {
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetails = (incident: HistoricalIncident) => {
    setSelectedIncident(incident);
    setModalOpen(true);
  };

  return (
    <>
      <div className="surface-card rounded-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-semibold text-aegis-text-primary">
            Historical Incident Log
          </h3>
          <p className="mt-0.5 text-xs text-aegis-text-muted">
            Persisted SQLite assessments · SHAP vectors stored with each record
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[
                  'Timestamp',
                  'Endpoint ID',
                  'Snapshot',
                  'Risk Score',
                  'Classification Tag',
                  'SHAP Top Contributor',
                  'Action Taken',
                  '',
                ].map((header) => (
                  <th
                    key={header || 'actions'}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-aegis-text-muted"
                  >
                    No incidents match the current filters.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const isHighSeverity = inc.severity === 'High' || inc.severity === 'Critical';
                  return (
                    <tr
                      key={inc.id}
                      className={cn(
                        'border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]',
                        isHighSeverity && 'bg-aegis-danger/[0.04]',
                      )}
                    >
                      <td className="px-4 py-3 text-xs tabular-nums text-aegis-text-muted">
                        {format(new Date(inc.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-aegis-text-secondary">
                        {inc.endpointId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isHighSeverity ? 'text-aegis-danger' : 'text-aegis-text-primary',
                          )}
                        >
                          {inc.snapshot_label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RiskScoreCell score={inc.riskScore} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <SeverityBadge severity={inc.severity} />
                          <p className="text-[10px] text-aegis-text-muted">{inc.classification}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-aegis-text-secondary">
                        {inc.shapTopContributor}
                      </td>
                      <td className="px-4 py-3 text-xs text-aegis-text-muted">
                        {inc.actionTaken}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-aegis-accent-primary hover:bg-aegis-accent-primary/10 hover:text-aegis-accent-primary"
                          onClick={() => openDetails(inc)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShapDetailModal
        incident={selectedIncident}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
