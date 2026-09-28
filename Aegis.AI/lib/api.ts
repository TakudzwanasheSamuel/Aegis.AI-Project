export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface ShapImpact {
  feature: string;
  impact: number;
}

export interface AssessmentRecord {
  id: number;
  timestamp: string;
  hostname: string;
  snapshot_label: string;
  pid: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  severity: string;
  top_shap_features: ShapImpact[];
  recommendation: string;
  harmonized_vector?: Record<string, number> | null;
  behavioural_level?: string;
  behavioural_score?: number;
  behavioural_reasons?: string[];
  triggered_by?: string;
  model_severity?: string;
  model_risk_score?: number;
}

export interface HistoryResponse {
  items: AssessmentRecord[];
  total: number;
  total_count?: number;
  page: number;
  page_size: number;
}

export interface MetricsResponse {
  total_scanned: number;
  threats_detected: number;
  safe_processes: number;
  avg_risk_score: number;
  latest_timestamp: string | null;
  severity_counts: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  db_connected: boolean;
  service?: string;
  version?: string;
}

export interface ModelSplitMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusion_matrix?: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}

export interface ResearchBenchmark {
  dataset: string;
  n_samples: number;
  n_features: number;
  features: string[];
  scaler: string;
  class_distribution?: {
    benign: number;
    malware: number;
  };
  models: {
    RandomForest: ModelSplitMetrics;
    XGBoost: ModelSplitMetrics;
  };
  feature_importance?: { feature: string; importance: number }[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`API ${path} failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMetrics() {
  return fetchJson<MetricsResponse>('/api/v1/telemetry/metrics');
}

export function fetchRecent(limit = 20) {
  return fetchJson<AssessmentRecord[]>(`/api/v1/telemetry/recent?limit=${limit}`);
}

export function fetchAssessment(idOrPid: number | string) {
  return fetchJson<AssessmentRecord>(`/api/v1/telemetry/assessment/${idOrPid}`);
}

export function fetchHistory(params: {
  severity?: string;
  search?: string;
  since?: string;
  until?: string;
  fromDate?: string;
  untilDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.severity && params.severity !== 'All') query.set('severity', params.severity);
  if (params.search) query.set('search', params.search);
  if (params.since) query.set('since', params.since);
  if (params.until) query.set('until', params.until);
  if (params.fromDate) query.set('from_date', params.fromDate);
  if (params.untilDate) query.set('until_date', params.untilDate);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.pageSize ?? 25));
  return fetchJson<HistoryResponse>(`/api/v1/telemetry/history?${query.toString()}`);
}

export function fetchResearchBenchmark() {
  return fetchJson<ResearchBenchmark>('/api/v1/analytics/research-benchmark');
}

export async function pingHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  payload: HealthResponse | null;
}> {
  const started = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const latencyMs = Math.max(1, Math.round(performance.now() - started));
    if (!response.ok) {
      return { ok: false, latencyMs, payload: null };
    }
    const payload = (await response.json()) as HealthResponse;
    const ok = payload.status === 'online' && payload.db_connected !== false;
    return { ok, latencyMs, payload };
  } catch {
    return {
      ok: false,
      latencyMs: Math.max(1, Math.round(performance.now() - started)),
      payload: null,
    };
  }
}

export function pickLatestFlagged(records: AssessmentRecord[]): AssessmentRecord | null {
  if (records.length === 0) return null;
  const ranked = ['CRITICAL', 'HIGH', 'MEDIUM'];
  for (const severity of ranked) {
    const match = records.find((record) => record.severity.toUpperCase() === severity);
    if (match) return match;
  }
  return records[0];
}

export function isAgentActive(latestTimestamp: string | null, windowMs = 10000) {
  if (!latestTimestamp) return false;
  const latest = new Date(latestTimestamp).getTime();
  if (Number.isNaN(latest)) return false;
  return Date.now() - latest <= windowMs;
}
