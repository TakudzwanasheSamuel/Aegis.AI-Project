export interface TelemetryPayload {
  hostname: string;
  snapshot_label: string;
  accessible_processes: number;
  pslist_nproc: number;
  pslist_nppid: number;
  pslist_avg_threads: number;
  pslist_avg_handlers: number;
  dlllist_ndlls: number;
  dlllist_avg_dlls_per_proc: number;
  handles_nhandles: number;
  handles_avg_handles_per_proc: number;
}

export type NumericTelemetryKey =
  | 'accessible_processes'
  | 'pslist_nproc'
  | 'pslist_nppid'
  | 'pslist_avg_threads'
  | 'pslist_avg_handlers'
  | 'dlllist_ndlls'
  | 'dlllist_avg_dlls_per_proc'
  | 'handles_nhandles'
  | 'handles_avg_handles_per_proc';

export interface ShapImpact {
  feature: string;
  impact: number;
}

export interface AssessmentResponse {
  telemetry_id: number;
  snapshot_label: string;
  pid: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  severity: string;
  top_shap_features: ShapImpact[];
  harmonized_vector: Record<string, number>;
  recommendation: string;
  triggered_by?: string;
  behavioural_level?: string;
  behavioural_score?: number;
  model_severity?: string;
  model_risk_score?: number;
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
  snapshot_label: 'SYSTEM_SNAPSHOT',
  accessible_processes: 38,
  pslist_nproc: 40,
  pslist_nppid: 15,
  pslist_avg_threads: 12.4,
  pslist_avg_handlers: 255,
  dlllist_ndlls: 2050,
  dlllist_avg_dlls_per_proc: 47.5,
  handles_nhandles: 11800,
  handles_avg_handles_per_proc: 268,
};

export const TELEMETRY_SLIDER_CONFIG: Array<{
  key: NumericTelemetryKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'accessible_processes', label: 'Accessible Processes', unit: '', min: 0, max: 400, step: 1 },
  { key: 'pslist_nproc', label: 'pslist.nproc', unit: '', min: 1, max: 400, step: 1 },
  { key: 'pslist_nppid', label: 'pslist.nppid', unit: '', min: 0, max: 200, step: 1 },
  { key: 'pslist_avg_threads', label: 'pslist.avg_threads', unit: '', min: 0, max: 40, step: 0.1 },
  { key: 'pslist_avg_handlers', label: 'pslist.avg_handlers', unit: '', min: 0, max: 600, step: 1 },
  { key: 'dlllist_ndlls', label: 'dlllist.ndlls', unit: '', min: 0, max: 6000, step: 10 },
  { key: 'dlllist_avg_dlls_per_proc', label: 'dlllist.avg_dlls_per_proc', unit: '', min: 0, max: 120, step: 0.1 },
  { key: 'handles_nhandles', label: 'handles.nhandles', unit: '', min: 0, max: 40000, step: 50 },
  { key: 'handles_avg_handles_per_proc', label: 'handles.avg_handles_per_proc', unit: '', min: 0, max: 800, step: 1 },
];
