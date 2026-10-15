'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subDays, subHours } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { FilterControlsBar } from '@/components/history/filter-controls-bar';
import { IncidentLogTable } from '@/components/history/incident-log-table';
import { RiskScoreBarChart } from '@/components/history/risk-score-bar-chart';
import { ThreatFrequencyChart } from '@/components/history/threat-frequency-chart';
import { Notice } from '@/components/ui-aegis';
import { Button } from '@/components/ui/button';
import { fetchHistory, type AssessmentRecord } from '@/lib/api';
import { recordToIncident, UI_TO_API_SEVERITY } from '@/lib/history/map-record';
import type { DateRangePreset, HistoricalIncident, Severity } from '@/lib/history/types';

const PAGE_SIZE = 25;
const CHART_PAGE_SIZE = 200;
const THREAT_SEVERITIES = ['MEDIUM', 'HIGH', 'CRITICAL'] as const;

async function fetchSeverityRows(params: {
  severity: string;
  search?: string;
  since?: string;
  until?: string;
}): Promise<AssessmentRecord[]> {
  const first = await fetchHistory({ ...params, page: 1, pageSize: CHART_PAGE_SIZE });
  const total = first.total_count ?? first.total ?? first.items.length;
  const items = [...first.items];
  const pages = Math.ceil(total / CHART_PAGE_SIZE);
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchHistory({ ...params, page, pageSize: CHART_PAGE_SIZE });
    items.push(...next.items);
  }
  return items;
}

export function HistoryAnalytics() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('7d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [severity, setSeverity] = useState<Severity | 'All'>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [threatIncidents, setThreatIncidents] = useState<HistoricalIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
        setLoaded(true);
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

  useEffect(() => {
    const selected = severity === 'All' ? undefined : UI_TO_API_SEVERITY[severity];
    if (selected === 'LOW') {
      setThreatIncidents([]);
      return;
    }
    const severities = selected ? [selected] : [...THREAT_SEVERITIES];
    let cancelled = false;

    const load = async () => {
      try {
        const groups = await Promise.all(
          severities.map((level) =>
            fetchSeverityRows({
              severity: level,
              search: debouncedSearch || undefined,
              since,
              until,
            }),
          ),
        );
        if (cancelled) return;
        setThreatIncidents(groups.flat().map(recordToIncident));
      } catch (err) {
        if (cancelled) return;
        setThreatIncidents([]);
        setError(err instanceof Error ? err.message : 'Unable to load assessment history.');
      }
    };

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [severity, debouncedSearch, since, until]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const threatData = useMemo(() => {
    const buckets = new Map<string, { alerts: number; sort: number }>();
    threatIncidents.forEach((incident) => {
      const ts = new Date(incident.timestamp);
      const time = ts.getTime();
      if (Number.isNaN(time)) return;
      const label = datePreset === '24h' ? format(ts, 'HH:00') : format(ts, 'MMM d');
      const current = buckets.get(label);
      if (current) {
        current.alerts += 1;
        current.sort = Math.min(current.sort, time);
      } else {
        buckets.set(label, { alerts: 1, sort: time });
      }
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[1].sort - b[1].sort)
      .map(([label, value]) => ({ label, alerts: value.alerts }));
  }, [threatIncidents, datePreset]);

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
    <div className="space-y-6">
      {error && <Notice>{error}</Notice>}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ThreatFrequencyChart
          data={threatData}
          subtitle={
            datePreset === '24h'
              ? 'Alert counts · every Moderate, High, and Critical row in this range, by hour'
              : 'Alert counts · every Moderate, High, and Critical row in this range, by day'
          }
        />
        <RiskScoreBarChart data={riskComparison} />
      </div>

      <IncidentLogTable
        incidents={incidents}
        loading={!loaded && !error}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p className="text-sm text-aegis-muted">
              Page {page} of {totalPages} · {total.toLocaleString()} matching records · {PAGE_SIZE} per page
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="h-8 gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
