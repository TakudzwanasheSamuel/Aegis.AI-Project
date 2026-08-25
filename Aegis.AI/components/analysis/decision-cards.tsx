import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export function RecommendationBanner({
  recommendation,
  severity,
}: {
  recommendation: string;
  severity: string;
}) {
  const tone = severity.toUpperCase();
  const isThreat = tone === 'HIGH' || tone === 'CRITICAL';
  const isCaution = tone === 'MEDIUM';

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-3 rounded-card border p-5',
          isThreat
            ? 'border-aegis-danger/25 bg-aegis-danger/[0.08]'
            : isCaution
              ? 'border-aegis-warning/25 bg-aegis-warning/[0.08]'
              : 'border-aegis-success/25 bg-aegis-success/[0.08]',
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            isThreat
              ? 'border-aegis-danger/20 bg-aegis-danger/10'
              : isCaution
                ? 'border-aegis-warning/20 bg-aegis-warning/10'
                : 'border-aegis-success/20 bg-aegis-success/10',
          )}
        >
          <ShieldCheck
            className={cn(
              'h-4.5 w-4.5',
              isThreat ? 'text-aegis-danger' : isCaution ? 'text-aegis-warning' : 'text-aegis-success',
            )}
          />
        </div>
        <div>
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isThreat ? 'text-aegis-danger' : isCaution ? 'text-aegis-warning' : 'text-aegis-success',
            )}
          >
            Analyst recommendation
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-aegis-text-secondary">{recommendation}</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-card border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-aegis-accent-primary/20 bg-aegis-accent-primary/10">
          <ShieldCheck className="h-4.5 w-4.5 text-aegis-accent-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-aegis-accent-primary">
            Decision-Support Mode
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-aegis-text-muted">
            AegisAI triages and explains endpoint behaviour. Isolation, backup, and process-tree
            actions remain outside this dissertation scope and require separate administrator
            authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
