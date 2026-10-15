'use client';

import { useState } from 'react';

import { LiveTerminal } from '@/components/dashboard/live-terminal';
import { ProcessTable } from '@/components/dashboard/process-table';
import type { AssessmentRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

type View = 'stream' | 'table';

function ViewSwitch({
  view,
  onChange,
  tone,
}: {
  view: View;
  onChange: (view: View) => void;
  tone: 'terminal' | 'panel';
}) {
  return (
    <div
      role="group"
      aria-label="Live Telemetry view"
      className={cn(
        'flex rounded-md border p-0.5',
        tone === 'terminal' ? 'border-terminal-rule' : 'border-aegis-rule bg-aegis-sunken',
      )}
    >
      {(['stream', 'table'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={view === option}
          className={cn(
            'rounded-sm px-2.5 py-0.5 text-xs font-medium transition-[color,transform] active:scale-[0.98]',
            view === option
              ? 'seg-active'
              : tone === 'terminal'
                ? 'text-terminal-muted hover:text-terminal-fg'
                : 'text-aegis-muted hover:text-aegis-ink',
          )}
        >
          {option === 'stream' ? 'Stream' : 'Table'}
        </button>
      ))}
    </div>
  );
}

/**
 * Live Telemetry with two views: the streaming terminal (default) and the
 * existing table. Both stay mounted so the stream keeps its buffer while the
 * table is shown.
 */
export function LiveTelemetry({
  records,
  updatedAt,
  agentConnected,
}: {
  records: AssessmentRecord[];
  updatedAt: Date | null;
  agentConnected: boolean;
}) {
  const [view, setView] = useState<View>('stream');

  return (
    <>
      <LiveTerminal
        records={records}
        agentConnected={agentConnected}
        ready={updatedAt !== null}
        hidden={view !== 'stream'}
        viewSwitch={<ViewSwitch view={view} onChange={setView} tone="terminal" />}
      />
      <div className={cn(view !== 'table' && 'hidden')}>
        <ProcessTable
          records={records}
          updatedAt={updatedAt}
          headerExtra={<ViewSwitch view={view} onChange={setView} tone="panel" />}
        />
      </div>
    </>
  );
}
