'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';

import type { AssessmentRecord } from '@/lib/api';
import { apiSeverityToUi } from '@/lib/history/map-record';

function statusFromSeverity(severity: string): 'Safe' | 'Warning' | 'High Risk' {
  const ui = apiSeverityToUi(severity);
  if (ui === 'Safe') return 'Safe';
  if (ui === 'Moderate') return 'Warning';
  return 'High Risk';
}

function StatusBadge({ status }: { status: 'Safe' | 'Warning' | 'High Risk' }) {
  const styles = {
    Safe: 'bg-aegis-success/10 text-aegis-success border-aegis-success/20',
    Warning: 'bg-aegis-warning/10 text-aegis-warning border-aegis-warning/20',
    'High Risk': 'bg-aegis-danger/10 text-aegis-danger border-aegis-danger/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function RiskBar({ risk }: { risk: number }) {
  const color = risk >= 70 ? '#EF4444' : risk >= 25 ? '#F59E0B' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/[0.06]">
        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, risk)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{risk}%</span>
    </div>
  );
}

interface ProcessTableProps {
  records: AssessmentRecord[];
  updatedAt: Date | null;
}

export function ProcessTable({ records, updatedAt }: ProcessTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter(
      (record) =>
        record.process_name.toLowerCase().includes(needle) ||
        record.hostname.toLowerCase().includes(needle) ||
        String(record.pid).includes(needle),
    );
  }, [query, records]);

  return (
    <div className="surface-card rounded-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-aegis-text-primary">Live Process Telemetry</h3>
          <p className="mt-0.5 text-xs text-aegis-text-muted">
            SQLite assessments · {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Waiting for first poll'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-aegis-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter processes..."
            className="w-32 bg-transparent text-xs text-aegis-text-secondary placeholder:text-aegis-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['PID', 'Process', 'Hostname', 'CPU', 'Memory', 'Threads', 'Handles', 'Risk', 'Status', ''].map((header) => (
                <th key={header || 'go'} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-aegis-text-muted">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-aegis-text-muted">
                  No assessments yet. Run the endpoint agent or send a sandbox payload.
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const status = statusFromSeverity(record.severity);
                const isHighRisk = status === 'High Risk';
                return (
                  <tr
                    key={record.id}
                    onClick={() => router.push(`/analysis?id=${record.id}`)}
                    className={`group cursor-pointer border-b border-white/[0.04] transition-all duration-300 hover:bg-white/[0.04] ${
                      isHighRisk ? 'bg-aegis-danger/[0.06]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs font-mono tabular-nums text-aegis-text-muted">{record.pid}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isHighRisk && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-danger opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-aegis-danger" />
                          </span>
                        )}
                        <span className={`text-xs font-medium ${isHighRisk ? 'text-aegis-danger' : 'text-aegis-text-primary'}`}>
                          {record.process_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[160px] truncate font-mono text-[11px] text-aegis-text-muted">
                        {record.hostname}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-aegis-text-secondary">
                      {(record.cpu_percent ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-aegis-text-secondary">
                      {(record.memory_mb ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-aegis-text-secondary">
                      {record.thread_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-aegis-text-secondary">
                      {record.open_handles ?? '—'}
                    </td>
                    <td className="px-4 py-3"><RiskBar risk={record.risk_score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/analysis?id=${record.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center justify-end"
                        aria-label={`Open SHAP analysis for ${record.process_name}`}
                      >
                        <ChevronRight className="h-4 w-4 text-aegis-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
