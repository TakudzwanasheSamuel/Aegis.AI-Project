'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

export function LiveSimulationCard() {
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);

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
    <div className="surface-card rounded-card border border-aegis-danger/25 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-aegis-danger/20 bg-aegis-danger/10">
            <ShieldAlert className="h-6 w-6 text-aegis-danger" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-aegis-text-primary">
              Live Ransomware Simulation
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-aegis-text-secondary">
              Launches a contained file-activity simulation on this machine. It rewrites and renames
              files inside a sandbox folder only, with no real encryption, and cleans up automatically.
            </p>
          </div>
        </div>
        <Button
          type="button"
          disabled={running}
          onClick={startSimulation}
          className="btn-gradient h-11 shrink-0 px-5 text-sm font-semibold text-white"
        >
          {running ? 'Simulation running…' : 'Start Live Simulation'}
        </Button>
      </div>
      {running && (
        <p className="mt-4 text-sm text-aegis-text-secondary">
          Open the Dashboard to watch the behavioural detector respond.
        </p>
      )}
      {note && <p className="mt-2 text-sm font-medium text-aegis-text-primary">{note}</p>}
    </div>
  );
}
