'use client';

import { FileText } from 'lucide-react';

import { ShapBarChart } from '@/components/charts/shap-bar-chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HistoricalIncident } from '@/lib/history/types';
import { SEVERITY_CLASSES, severityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

interface ShapDetailModalProps {
  incident: HistoricalIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShapDetailModal({ incident, open, onOpenChange }: ShapDetailModalProps) {
  if (!incident) return null;

  const topPositive = incident.shapVector
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  const tone = SEVERITY_CLASSES[severityLevel(incident.severity)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl gap-5 overflow-y-auto rounded-lg border-aegis-rule bg-aegis-surface p-5 text-aegis-ink shadow-none sm:p-6">
        <DialogHeader className="space-y-1 pr-8 text-left">
          <DialogTitle className="font-serif text-xl font-semibold leading-tight tracking-normal text-aegis-ink">
            Historical SHAP Explanation
          </DialogTitle>
          <DialogDescription className="text-sm text-aegis-muted">
            {incident.snapshot_label} · <span className="font-mono">{incident.hostname}</span>
          </DialogDescription>
        </DialogHeader>

        <ShapBarChart
          data={incident.shapVector}
          height={256}
          xTickFormatter={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
          tooltipFormatter={(value) => [
            `${value >= 0 ? '+' : ''}${value.toFixed(2)} SHAP impact`,
            'Attribution',
          ]}
        />

        <div className="border-t border-aegis-rule pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-aegis-ink">
            <FileText className="h-4 w-4 text-aegis-muted" aria-hidden="true" />
            Archived Diagnostic Summary
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-aegis-ink-2">
            {incident.severity === 'Safe' ? (
              <>
                Process classified as <span className={cn('font-semibold', tone.text)}>SAFE</span>{' '}
                with no significant malicious indicators in the persisted SHAP vector.
              </>
            ) : (
              <>
                Process flagged as{' '}
                <span className={cn('font-semibold', tone.text)}>
                  {incident.severity.toUpperCase()}
                </span>{' '}
                primarily due to{' '}
                {topPositive.map((e, i) => (
                  <span key={e.feature}>
                    {i > 0 ? ' combined with ' : ''}
                    <span className="font-mono font-medium text-aegis-ink">
                      {e.feature} ({e.value >= 0 ? '+' : ''}
                      {e.value.toFixed(2)})
                    </span>
                  </span>
                ))}
                . Action taken: {incident.actionTaken}.
              </>
            )}
          </p>
        </div>

        <p className="text-xs text-aegis-muted">
          Vector persisted with assessment <span className="font-mono">#{incident.id}</span> in SQLite
          assessment_records
        </p>
      </DialogContent>
    </Dialog>
  );
}
