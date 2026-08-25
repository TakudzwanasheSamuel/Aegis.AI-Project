export interface TelemetryPayload {
  hostname: string;
  process_name: string;
  pid: number;
  cpu_percent: number;
  memory_mb: number;
  thread_count: number;
  open_handles: number;
  loaded_modules: number;
}

export type NumericTelemetryKey =
  | 'cpu_percent'
  | 'memory_mb'
  | 'thread_count'
  | 'open_handles'
  | 'loaded_modules';

export interface ShapImpact {
  feature: string;
  impact: number;
}

export interface AssessmentResponse {
  telemetry_id: number;
  process_name: string;
  pid: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  severity: string;
  top_shap_features: ShapImpact[];
  harmonized_vector: Record<string, number>;
  recommendation: string;
}

export interface FastApiResponse {
  status_code: number;
  inference_time_ms: number;
  assessment: AssessmentResponse | null;
  error?: string;
  telemetry: TelemetryPayload;
  scenario_id?: number;
  timestamp: string;
}

export interface SandboxScenario {
  id: number;
  title: string;
  subtext: string;
  badge: string;
  badgeClassName: string;
  telemetry: TelemetryPayload;
}

export const DEFAULT_TELEMETRY: TelemetryPayload = {
  hostname: 'SANDBOX-VIVA',
  process_name: 'explorer.exe',
  pid: 4242,
  cpu_percent: 12,
  memory_mb: 512,
  thread_count: 28,
  open_handles: 420,
  loaded_modules: 32,
};

export const TELEMETRY_SLIDER_CONFIG: Array<{
  key: NumericTelemetryKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'cpu_percent', label: 'CPU Utilization', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'memory_mb', label: 'RAM Allocation', unit: 'MB', min: 0, max: 4096, step: 16 },
  { key: 'thread_count', label: 'Active Thread Count', unit: '', min: 1, max: 250, step: 1 },
  { key: 'open_handles', label: 'Open Handle Count', unit: '', min: 0, max: 2000, step: 10 },
  { key: 'loaded_modules', label: 'Loaded Modules / DLLs', unit: '', min: 0, max: 150, step: 1 },
];
