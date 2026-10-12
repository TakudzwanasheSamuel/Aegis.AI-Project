import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export function RecommendationBanner({
  severity,
  triggeredBy,
}: {
  severity: string;
  triggeredBy?: string;
}) {
  const tone = severity.toUpperCase();
  const isThreat = tone === 'HIGH' || tone === 'CRITICAL';
  const isCaution = tone === 'MEDIUM';

  let recommendation =
    'No immediate action is required. The latest snapshot is consistent with normal endpoint activity. Continue routine monitoring and review this host again if a later assessment is flagged.';
  if (triggeredBy === 'behavioural' && isThreat) {
    recommendation =
      'Treat this host as a suspected ransomware incident. Disconnect it from the network, identify the program responsible for the file renames and rewrites, and preserve the affected files for review. Do not continue normal work on this machine until that program has been found and the file activity has stopped.';
  } else if (triggeredBy === 'behavioural' && isCaution) {
    recommendation =
      'File activity on this host is outside the normal pattern, but it has not reached a critical level. Identify the program that is modifying and renaming files, confirm whether the activity is expected, and keep the host under close watch until the pattern returns to normal.';
  } else if (isThreat) {
    recommendation =
      'The memory profile for this snapshot matches known malicious behaviour. Investigate the host, review the indicators that raised the score, and confirm whether an untrusted program is running. Limit further use of the machine until that review is complete.';
  } else if (isCaution) {
    recommendation =
      'This snapshot sits outside the normal baseline, but it is not classified as a high-severity threat. Keep the host under observation, compare the next assessments with this one, and investigate only if the score rises or file activity becomes suspicious.';
  }

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
    </div>
  );
}
