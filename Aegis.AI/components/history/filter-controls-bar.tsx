'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Download, Search } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

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
    <div className="surface-card rounded-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range presets */}
          <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onDatePresetChange(preset.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  datePreset === preset.value
                    ? 'bg-aegis-accent-primary/20 text-aegis-accent-primary'
                    : 'text-aegis-text-muted hover:text-aegis-text-secondary',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 border-white/[0.08] bg-white/[0.02] text-xs text-aegis-text-secondary hover:bg-white/[0.04]"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
            <SelectTrigger className="h-9 w-[140px] border-white/[0.08] bg-white/[0.02] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Severities</SelectItem>
              <SelectItem value="Safe">Safe</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-aegis-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search PID, process, or endpoint..."
              className="w-52 bg-transparent text-xs text-aegis-text-secondary placeholder:text-aegis-text-muted focus:outline-none sm:w-64"
            />
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-2 btn-gradient text-xs font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Export Logs
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-aegis-text-muted">
        Persisted via SQLite assessment_records ·{' '}
        <span className="tabular-nums text-aegis-text-secondary">
          {total ?? filteredIncidents.length}
        </span>{' '}
        records matching filters
      </p>
    </div>
  );
}
