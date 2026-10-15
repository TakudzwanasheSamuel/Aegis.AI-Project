'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Download, Search } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Panel } from '@/components/ui-aegis';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  downloadFile,
  exportIncidentsAsCsv,
  exportIncidentsAsJson,
} from '@/lib/history/export';
import type { DateRangePreset, HistoricalIncident, Severity } from '@/lib/history/types';
import { cn } from '@/lib/utils';

interface FilterControlsBarProps {
  datePreset: DateRangePreset;
  onDatePresetChange: (preset: DateRangePreset) => void;
  customRange: DateRange | undefined;
  onCustomRangeChange: (range: DateRange | undefined) => void;
  severity: Severity | 'All';
  onSeverityChange: (severity: Severity | 'All') => void;
  search: string;
  onSearchChange: (search: string) => void;
  filteredIncidents: HistoricalIncident[];
  total?: number;
}

/** 36px controls: rule border, surface background, accent focus ring. */
const CONTROL = 'h-9 rounded-md border border-aegis-rule bg-aegis-surface text-sm text-aegis-ink';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function FilterControlsBar({
  datePreset,
  onDatePresetChange,
  customRange,
  onCustomRangeChange,
  severity,
  onSeverityChange,
  search,
  onSearchChange,
  filteredIncidents,
  total,
}: FilterControlsBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      downloadFile(
        exportIncidentsAsCsv(filteredIncidents),
        `aegis-incident-logs-${timestamp}.csv`,
        'text/csv;charset=utf-8',
      );
    } else {
      downloadFile(
        exportIncidentsAsJson(filteredIncidents),
        `aegis-incident-logs-${timestamp}.json`,
        'application/json',
      );
    }
  };

  const customLabel =
    customRange?.from && customRange?.to
      ? `${format(customRange.from, 'MMM d')} – ${format(customRange.to, 'MMM d, yyyy')}`
      : customRange?.from
        ? format(customRange.from, 'MMM d, yyyy')
        : 'Pick dates';

  return (
    <Panel as="div" bodyClassName="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range presets */}
        <div
          role="group"
          aria-label="Time range"
          className="flex h-9 items-center rounded-md border border-aegis-rule bg-aegis-sunken p-0.5"
        >
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onDatePresetChange(preset.value)}
              aria-pressed={datePreset === preset.value}
              className={cn(
                'h-full whitespace-nowrap rounded-sm px-3 text-sm transition-[color,transform] active:scale-[0.98]',
                datePreset === preset.value
                  ? 'seg-active font-medium'
                  : 'text-aegis-muted hover:text-aegis-ink',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(CONTROL, 'gap-2 font-normal')}>
                <CalendarIcon className="h-4 w-4 text-aegis-muted" aria-hidden="true" />
                <span className="font-mono text-xs tabular-nums">{customLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-lg border-aegis-rule bg-aegis-surface p-0 shadow-md"
              align="start"
            >
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={onCustomRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Severity filter */}
        <Select value={severity} onValueChange={(v) => onSeverityChange(v as Severity | 'All')}>
          <SelectTrigger className={cn(CONTROL, 'w-[160px]')} aria-label="Severity">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="rounded-md border-aegis-rule bg-aegis-surface text-aegis-ink">
            <SelectItem value="All">All Severities</SelectItem>
            <SelectItem value="Safe">Safe</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <label
          className={cn(
            CONTROL,
            'flex min-w-0 flex-1 basis-56 items-center gap-2 px-3 focus-within:border-aegis-accent focus-within:ring-1 focus-within:ring-aegis-accent sm:max-w-sm',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-aegis-muted" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search PID, process, or endpoint..."
            aria-label="Search PID, process, or endpoint"
            className="min-w-0 flex-1 bg-transparent text-sm text-aegis-ink placeholder:text-aegis-muted focus:outline-none focus-visible:outline-none"
          />
        </label>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="ml-auto h-9 gap-2">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Logs
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-md border-aegis-rule bg-aegis-surface text-aegis-ink"
          >
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-2.5 text-xs text-aegis-muted">
        Persisted via SQLite assessment_records ·{' '}
        <span className="font-mono tabular-nums text-aegis-ink-2">
          {total ?? filteredIncidents.length}
        </span>{' '}
        records matching filters
      </p>
    </Panel>
  );
}
