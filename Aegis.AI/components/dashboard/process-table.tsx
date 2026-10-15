'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';

import { DataTable, Panel, RiskBar, SeverityBadge, Skeleton, THead, Td, Th, Tr } from '@/components/ui-aegis';
import type { AssessmentRecord } from '@/lib/api';
import { apiSeverityToUi } from '@/lib/history/map-record';
import { SEVERITY_CLASSES } from '@/lib/severity';
import { cn } from '@/lib/utils';

function statusFromSeverity(severity: string): 'Safe' | 'Warning' | 'High Risk' {
  const ui = apiSeverityToUi(severity);
  if (ui === 'Safe') return 'Safe';
  if (ui === 'Moderate') return 'Warning';
  return 'High Risk';
}

interface ProcessTableProps {
  records: AssessmentRecord[];
  updatedAt: Date | null;
  /** Extra header control (the Stream | Table switch). */
  headerExtra?: React.ReactNode;
}

interface TelemetryLog {
  id: number;
  text: string;
  tone: 'safe' | 'warning' | 'danger';
}

const LOG_TONE_CLASS: Record<TelemetryLog['tone'], string> = {
  safe: SEVERITY_CLASSES.safe.strongText,
  warning: SEVERITY_CLASSES.moderate.strongText,
  danger: SEVERITY_CLASSES.high.strongText,
};

export function ProcessTable({ records, updatedAt, headerExtra }: ProcessTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [now, setNow] = useState<Date | null>(null);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [flashId, setFlashId] = useState<number | null>(null);
  const seenId = useRef<number | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const latest = records[0];
    if (!latest) return;
    if (seenId.current === null) {
      seenId.current = latest.id;
      return;
    }
    if (latest.id === seenId.current) return;

    seenId.current = latest.id;
    const status = statusFromSeverity(latest.severity);
    const stamp = new Date(latest.timestamp);
    const time = Number.isNaN(stamp.getTime())
      ? new Date().toLocaleTimeString()
      : stamp.toLocaleTimeString();
    const tone: TelemetryLog['tone'] =
      status === 'High Risk' ? 'danger' : status === 'Warning' ? 'warning' : 'safe';

    setLogs((current) =>
      [
        {
          id: latest.id,
          tone,
          text: `${time}  ${latest.snapshot_label}  ${latest.hostname}  ${status}  ${latest.risk_score}%`,
        },
        ...current,
      ].slice(0, 8),
    );
    setFlashId(latest.id);
    // Matches the 1.5s .row-arrival fade in globals.css.
    const timer = window.setTimeout(() => setFlashId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [records]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter(
      (record) =>
        record.snapshot_label.toLowerCase().includes(needle) ||
        record.hostname.toLowerCase().includes(needle),
    );
  }, [query, records]);

  const hostname = records[0]?.hostname ?? 'endpoint';
  const scanLine = now
    ? `${now.toLocaleTimeString()}  scanning  ${hostname}  no new snapshot`
    : `scanning  ${hostname}  no new snapshot`;

  return (
    <Panel
      title="Live Telemetry"
      flush
      meta={
        <>
          {headerExtra}
          <span className="font-mono text-xs tabular-nums">
            {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Waiting for the first update'}
          </span>
          <label className="flex h-8 items-center gap-2 rounded-md border border-aegis-rule bg-aegis-paper px-2.5 focus-within:border-aegis-accent">
            <Search className="h-4 w-4 shrink-0 text-aegis-muted" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter snapshots..."
              aria-label="Filter snapshots"
              className="w-36 bg-transparent text-sm text-aegis-ink placeholder:text-aegis-muted focus:outline-none focus-visible:outline-none"
            />
          </label>
        </>
      }
    >
      {/* Agent activity log */}
      <div
        className="border-b border-aegis-rule bg-aegis-sunken px-5 py-2.5 font-mono text-xs leading-5">
        <p className="truncate text-aegis-muted">{scanLine}</p>
        {logs.map((entry) => (
          <p key={entry.id} className={cn('truncate', LOG_TONE_CLASS[entry.tone])}>
            {entry.text}
          </p>
        ))}
      </div>

      <DataTable minWidth="min-w-[640px]" label="Live Telemetry">
        <THead>
          <tr>
            <Th>Snapshot</Th>
            <Th>Hostname</Th>
            <Th align="right">Risk</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Open</span>
            </Th>
          </tr>
        </THead>
        <tbody>
          {filtered.length === 0 && !updatedAt ? (
            // First fetch still in flight: shimmer rows instead of the empty-state text.
            [0, 1, 2, 3].map((row) => (
              <tr key={row} className="border-b border-aegis-rule last:border-b-0" aria-hidden="true">
                <Td><Skeleton className="h-4 w-32" /></Td>
                <Td><Skeleton className="h-4 w-24" /></Td>
                <Td align="right"><Skeleton className="ml-auto h-4 w-20" /></Td>
                <Td><Skeleton className="h-4 w-16" /></Td>
                <Td />
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <Td colSpan={5} align="center" className="h-24 text-aegis-muted">
                No assessments yet. Run the endpoint agent or send a sandbox payload.
              </Td>
            </tr>
          ) : (
            filtered.map((record) => {
              const status = statusFromSeverity(record.severity);
              return (
                <Tr
                  key={record.id}
                  interactive
                  onClick={() => router.push(`/analysis?id=${record.id}`)}
                  className={cn('group', flashId === record.id && 'row-arrival')}
                >
                  <Td className="font-medium">{record.snapshot_label}</Td>
                  <Td>
                    <span className="block max-w-[160px] truncate font-mono text-xs text-aegis-ink-2">
                      {record.hostname}
                    </span>
                  </Td>
                  <Td align="right">
                    <RiskBar risk={record.risk_score} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <SeverityBadge severity={status} />
                      {record.triggered_by && (
                        <span className="whitespace-nowrap text-xs text-aegis-muted">
                          {record.triggered_by === 'behavioural'
                            ? 'File-Activity Monitor'
                            : 'Memory-forensic model'}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right" className="w-10 pl-0">
                    <Link
                      href={`/analysis?id=${record.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex rounded-sm text-aegis-muted hover:text-aegis-ink"
                      aria-label={`Open analysis for ${record.snapshot_label}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </DataTable>
    </Panel>
  );
}
