'use client';

import { CountUp } from '@/components/motion/count-up';
import { KeyValue, KeyValueList, Panel, RiskScale, SeverityBadge } from '@/components/ui-aegis';
import type { AssessmentRecord } from '@/lib/api';
import { apiSeverityToUi } from '@/lib/history/map-record';
import { SEVERITY_CLASSES, severityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ProcessTargetHeader({ record }: { record: AssessmentRecord }) {
  const uiSeverity = apiSeverityToUi(record.severity);
  const tone = SEVERITY_CLASSES[severityLevel(uiSeverity)];
  const confidencePct = Math.round(record.confidence * 1000) / 10;

  const info = [
    { label: 'Assessed', value: formatStamp(record.timestamp) },
    { label: 'Hostname', value: record.hostname },
  ];
  const detector =
    record.triggered_by === 'behavioural'
      ? 'Detected by: File-Activity Monitor'
      : 'Detected by: Memory-forensic model';

  return (
    <Panel as="div">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-all font-mono text-lg font-medium tracking-normal text-aegis-ink">
            {record.snapshot_label}
          </h2>
          <p className="mt-0.5 text-sm text-aegis-muted">
            Assessment <span className="font-mono tabular-nums">#{record.id}</span> · {record.prediction}
          </p>

          <KeyValueList className="mt-4">
            {info.map((item) => (
              <KeyValue key={item.label} label={item.label} mono>
                {item.value}
              </KeyValue>
            ))}
          </KeyValueList>
          <p className="mt-3 text-sm text-aegis-ink-2">{detector}</p>
        </div>

        <div className="shrink-0 border-t border-aegis-rule pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-right">
          <SeverityBadge severity={uiSeverity}>
            [{uiSeverity === 'Safe' ? 'SAFE' : `${uiSeverity.toUpperCase()} THREAT`}]
          </SeverityBadge>
          <p className={cn('mt-2 text-[2rem] font-medium leading-none', tone.text)}>
            <CountUp value={record.risk_score} format={(n) => `${Math.round(n)}%`} />
          </p>
          <RiskScale value={record.risk_score} className="mt-3 w-40 sm:ml-auto" />
          <p className="mt-2 text-xs text-aegis-muted">
            Risk score · <CountUp value={confidencePct} format={(n) => `${Math.round(n * 10) / 10}%`} /> confidence
          </p>
        </div>
      </div>
    </Panel>
  );
}
