'use client';

import { useEffect, useState } from 'react';
import { Info, Loader2, ShieldAlert } from 'lucide-react';

import { CountUp } from '@/components/motion/count-up';
import { Notice, Panel, StatusDot, buttonClasses } from '@/components/ui-aegis';
import { API_BASE_URL } from '@/lib/api';

export function LiveSimulationCard() {
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const readStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/demo/status`);
        if (!response.ok) return null;
        const body = (await response.json()) as { running?: boolean };
        return Boolean(body.running);
      } catch {
        return null;
      }
    };

    readStatus().then((isRunning) => {
      if (!cancelled && isRunning) setRunning(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/demo/status`);
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as { running?: boolean };
        if (cancelled) return;
        if (!body.running) {
          setRunning(false);
          setNote('Simulation complete.');
        }
      } catch {
        // Keep the current state and try again on the next poll.
      }
    };

    const timer = window.setInterval(check, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [running]);

  // Elapsed time while running, measured from when this page saw the run start.
  useEffect(() => {
    if (!running) {
      setStartedAt(null);
      return;
    }
    const start = startedAt ?? Date.now();
    if (startedAt === null) setStartedAt(start);
    setElapsed(Math.floor((Date.now() - start) / 1000));
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  const startSimulation = async () => {
    setNote(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/demo/simulate-ransomware?duration=30`,
        { method: 'POST' },
      );
      if (response.status === 409) {
        setRunning(true);
        setNote('A simulation is already running.');
        return;
      }
      if (!response.ok) {
        setNote('Could not start the simulation.');
        return;
      }
      setRunning(true);
    } catch {
      setNote('Could not start the simulation.');
    }
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-aegis-high" aria-hidden="true" />
          Live Ransomware Simulation
        </span>
      }
    >
      <Notice tone="info" className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-aegis-accent" aria-hidden="true" />
        <span className="leading-relaxed">
          Launches a contained file-activity simulation on this machine. It rewrites and renames
          files inside a sandbox folder only, with no real encryption, and cleans up automatically.
        </span>
      </Notice>

      <button
        type="button"
        disabled={running}
        aria-busy={running}
        onClick={startSimulation}
        className={buttonClasses('primary', 'md', 'mt-4 h-10 w-full')}
      >
        {running && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {running ? 'Simulation running…' : 'Start Live Simulation'}
      </button>

      {running && (
        <div className="mt-4" role="status">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-aegis-sunken" aria-hidden="true">
            <span className="indeterminate bg-grad-severity absolute inset-y-0 w-1/3 rounded-full" />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-aegis-ink-2">
              <StatusDot tone="high" />
              Open the Dashboard to watch the behavioural detector respond.
            </span>
            <span className="text-xs text-aegis-muted">
              <CountUp value={elapsed} format={(n) => `${Math.round(n)}s`} />
            </span>
          </div>
        </div>
      )}
      {note && <p className="mt-3 text-sm font-medium text-aegis-ink">{note}</p>}
    </Panel>
  );
}
