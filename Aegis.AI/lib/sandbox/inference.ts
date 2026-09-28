import type { AssessmentResponse, FastApiResponse, TelemetryPayload } from './types';

import { API_BASE_URL } from '@/lib/api';

export function buildAssessPayload(telemetry: TelemetryPayload): TelemetryPayload {
  return {
    hostname: telemetry.hostname || 'SANDBOX-VIVA',
    snapshot_label: telemetry.snapshot_label || 'SYSTEM_SNAPSHOT',
    accessible_processes: Math.max(0, Math.trunc(Number(telemetry.accessible_processes) || 0)),
    pslist_nproc: Math.max(0, Math.trunc(Number(telemetry.pslist_nproc) || 0)),
    pslist_nppid: Math.max(0, Math.trunc(Number(telemetry.pslist_nppid) || 0)),
    pslist_avg_threads: Number(telemetry.pslist_avg_threads) || 0,
    pslist_avg_handlers: Number(telemetry.pslist_avg_handlers) || 0,
    dlllist_ndlls: Math.max(0, Math.trunc(Number(telemetry.dlllist_ndlls) || 0)),
    dlllist_avg_dlls_per_proc: Number(telemetry.dlllist_avg_dlls_per_proc) || 0,
    handles_nhandles: Math.max(0, Math.trunc(Number(telemetry.handles_nhandles) || 0)),
    handles_avg_handles_per_proc: Number(telemetry.handles_avg_handles_per_proc) || 0,
  };
}

export async function sendTelemetryToGateway(
  telemetry: TelemetryPayload,
  options?: { scenario_id?: number },
): Promise<FastApiResponse> {
  const payload = buildAssessPayload(telemetry);
  const started = performance.now();
  const endpoint = `${API_BASE_URL}/api/v1/telemetry/assess`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const inferenceTimeMs = Math.round(performance.now() - started);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        body && typeof body === 'object' && 'detail' in body
          ? String((body as { detail: unknown }).detail)
          : `Gateway returned HTTP ${response.status}`;
      return {
        status_code: response.status,
        inference_time_ms: inferenceTimeMs,
        assessment: null,
        error: detail,
        telemetry: payload,
        scenario_id: options?.scenario_id,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status_code: response.status,
      inference_time_ms: inferenceTimeMs,
      assessment: body as AssessmentResponse,
      telemetry: payload,
      scenario_id: options?.scenario_id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status_code: 0,
      inference_time_ms: Math.round(performance.now() - started),
      assessment: null,
      error:
        error instanceof Error
          ? `${error.message}. Is FastAPI running at ${API_BASE_URL}?`
          : `Unable to reach FastAPI at ${API_BASE_URL}`,
      telemetry: payload,
      scenario_id: options?.scenario_id,
      timestamp: new Date().toISOString(),
    };
  }
}

const CSV_KEY_MAP: Record<string, keyof TelemetryPayload> = {
  hostname: 'hostname',
  host: 'hostname',
  snapshot_label: 'snapshot_label',
  snapshotlabel: 'snapshot_label',
  accessible_processes: 'accessible_processes',
  accessibleprocesses: 'accessible_processes',
  pslist_nproc: 'pslist_nproc',
  pslist_nppid: 'pslist_nppid',
  pslist_avg_threads: 'pslist_avg_threads',
  pslist_avg_handlers: 'pslist_avg_handlers',
  dlllist_ndlls: 'dlllist_ndlls',
  dlllist_avg_dlls_per_proc: 'dlllist_avg_dlls_per_proc',
  handles_nhandles: 'handles_nhandles',
  handles_avg_handles_per_proc: 'handles_avg_handles_per_proc',
};

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function parseTelemetryFile(content: string, filename: string): TelemetryPayload {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return mapRecordToTelemetry(parsed);
  }

  if (ext === 'csv') {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV must include a header row and at least one data row.');
    }

    const headers = lines[0].split(',').map(normalizeKey);
    const values = lines[1].split(',').map((value) => value.trim());
    const record: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      record[header] = values[index];
    });

    return mapRecordToTelemetry(record);
  }

  throw new Error('Unsupported file type. Upload a .json or .csv telemetry payload.');
}

function mapRecordToTelemetry(record: Record<string, unknown>): TelemetryPayload {
  const telemetry: TelemetryPayload = {
    hostname: 'SANDBOX-VIVA',
    snapshot_label: 'UPLOADED_SNAPSHOT',
    accessible_processes: 0,
    pslist_nproc: 0,
    pslist_nppid: 0,
    pslist_avg_threads: 0,
    pslist_avg_handlers: 0,
    dlllist_ndlls: 0,
    dlllist_avg_dlls_per_proc: 0,
    handles_nhandles: 0,
    handles_avg_handles_per_proc: 0,
  };

  for (const [rawKey, value] of Object.entries(record)) {
    const mappedKey = CSV_KEY_MAP[normalizeKey(rawKey)];
    if (!mappedKey || value === undefined || value === null || value === '') continue;
    if (mappedKey === 'hostname' || mappedKey === 'snapshot_label') {
      telemetry[mappedKey] = String(value);
    } else {
      telemetry[mappedKey] = Number(value);
    }
  }

  return telemetry;
}
