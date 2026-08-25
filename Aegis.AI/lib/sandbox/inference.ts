import type { AssessmentResponse, FastApiResponse, TelemetryPayload } from './types';

import { API_BASE_URL } from '@/lib/api';

export function buildAssessPayload(telemetry: TelemetryPayload): TelemetryPayload {
  return {
    hostname: telemetry.hostname || 'SANDBOX-VIVA',
    process_name: telemetry.process_name || 'unknown.exe',
    pid: Number.isFinite(telemetry.pid) ? Math.trunc(telemetry.pid) : 0,
    cpu_percent: Number(telemetry.cpu_percent) || 0,
    memory_mb: Number(telemetry.memory_mb) || 0,
    thread_count: Math.max(1, Math.trunc(Number(telemetry.thread_count) || 1)),
    open_handles: Math.max(0, Math.trunc(Number(telemetry.open_handles) || 0)),
    loaded_modules: Math.max(0, Math.trunc(Number(telemetry.loaded_modules) || 0)),
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
  process_name: 'process_name',
  processname: 'process_name',
  process: 'process_name',
  pid: 'pid',
  cpu_percent: 'cpu_percent',
  cpu_utilization: 'cpu_percent',
  cpuutilization: 'cpu_percent',
  cpu: 'cpu_percent',
  memory_mb: 'memory_mb',
  ram_allocation_mb: 'memory_mb',
  ramallocationmb: 'memory_mb',
  ram: 'memory_mb',
  thread_count: 'thread_count',
  active_thread_count: 'thread_count',
  activethreadcount: 'thread_count',
  threads: 'thread_count',
  open_handles: 'open_handles',
  open_handle_count: 'open_handles',
  openhandlecount: 'open_handles',
  handles: 'open_handles',
  loaded_modules: 'loaded_modules',
  loadedmodules: 'loaded_modules',
  modules: 'loaded_modules',
  dlls: 'loaded_modules',
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
    process_name: 'uploaded.exe',
    pid: 1000,
    cpu_percent: 0,
    memory_mb: 0,
    thread_count: 1,
    open_handles: 0,
    loaded_modules: 0,
  };

  for (const [rawKey, value] of Object.entries(record)) {
    const mappedKey = CSV_KEY_MAP[normalizeKey(rawKey)];
    if (!mappedKey || value === undefined || value === null || value === '') continue;
    if (mappedKey === 'hostname' || mappedKey === 'process_name') {
      telemetry[mappedKey] = String(value);
    } else {
      telemetry[mappedKey] = Number(value);
    }
  }

  return telemetry;
}
