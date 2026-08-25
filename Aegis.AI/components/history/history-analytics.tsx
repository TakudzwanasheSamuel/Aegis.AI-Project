'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subDays, subHours } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { FilterControlsBar } from '@/components/history/filter-controls-bar';
import { IncidentLogTable } from '@/components/history/incident-log-table';
import { RiskScoreBarChart } from '@/components/history/risk-score-bar-chart';
import { ThreatFrequencyChart } from '@/components/history/threat-frequency-chart';
import { Button } from '@/components/ui/button';
import { fetchHistory } from '@/lib/api';
import { recordToIncident, UI_TO_API_SEVERITY } from '@/lib/history/map-record';
import type { DateRangePreset, HistoricalIncident, Severity } from '@/lib/history/types';

const PAGE_SIZE = 25;

export function HistoryAnalytics() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('7d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [severity, setSeverity] = useState<Severity | 'All'>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [datePreset, customRange, severity, debouncedSearch]);

  const since = useMemo(() => {
    const now = new Date();
    if (datePreset === '24h') return subHours(now, 24).toISOString();
    if (datePreset === '7d') return subDays(now, 7).toISOString();
    if (customRange?.from) return customRange.from.toISOString();
    return subDays(now, 7).toISOString();
  }, [datePreset, customRange]);

  const until = useMemo(() => {
    if (datePreset !== 'custom' || !customRange?.to) return undefined;
    const end = new Date(customRange.to);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, [datePreset, customRange]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetchHistory({
          severity: severity === 'All' ? undefined : UI_TO_API_SEVERITY[severity],
          search: debouncedSearch || undefined,
          since,
          until,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setIncidents(response.items.map(recordToIncident));
        setTotal(response.total_count ?? response.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load assessment history.');
      }
    };
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [severity, debouncedSearch, since, until, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const threatData = useMemo(() => {
    const buckets = new Map<string, number>();
    incidents.forEach((incident) => {
      const ts = new Date(incident.timestamp);
      const label = datePreset === '24h' ? format(ts, 'HH:00') : format(ts, 'MMM d');
      if (
        incident.severity === 'High' ||
        incident.severity === 'Critical' ||
        incident.severity === 'Moderate'
      ) {
        buckets.set(label, (buckets.get(label) ?? 0) + 1);
      }
    });
    return Array.from(buckets.entries()).map(([label, alerts]) => ({ label, alerts }));
  }, [incidents, datePreset]);

  const riskComparison = useMemo(() => {
    const buckets = new Map<string, { benign: number[]; malicious: number[] }>();
    incidents.forEach((incident) => {
      const ts = new Date(incident.timestamp);
      const label = datePreset === '24h' ? format(ts, 'HH:00') : format(ts, 'MMM d');
      if (!buckets.has(label)) buckets.set(label, { benign: [], malicious: [] });
      const bucket = buckets.get(label)!;
      if (incident.severity === 'Safe') bucket.benign.push(incident.riskScore);
      else bucket.malicious.push(incident.riskScore);
    });
    return Array.from(buckets.entries()).map(([label, values]) => ({
      label,
      benign: values.benign.length
        ? values.benign.reduce((sum, n) => sum + n, 0) / values.benign.length
        : 0,
      malicious: values.malicious.length
        ? values.malicious.reduce((sum, n) => sum + n, 0) / values.malicious.length
        : 0,
    }));
  }, [incidents, datePreset]);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-aegis-danger/20 bg-aegis-danger/10 px-3 py-2 text-xs text-aegis-danger">
          {error}
        </p>
      )}
      <FilterControlsBar
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        severity={severity}
        onSeverityChange={setSeverity}
        search={search}
        onSearchChange={setSearch}
        filteredIncidents={incidents}
        total={total}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ThreatFrequencyChart
          data={threatData}
          subtitle={
            datePreset === '24h'
              ? 'Alert counts · hourly buckets from the current history page'
              : 'Alert counts · daily buckets from the current history page'
          }
        />
        <RiskScoreBarChart data={riskComparison} />
      </div>

      <IncidentLogTable incidents={incidents} />

      <div className="flex items-center justify-between rounded-card border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-xs text-aegis-text-muted">
          Page {page} of {totalPages} · {total.toLocaleString()} matching records · {PAGE_SIZE} per page
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-8 gap-1 border-white/[0.08] bg-white/[0.03] text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-8 gap-1 border-white/[0.08] bg-white/[0.03] text-xs"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
