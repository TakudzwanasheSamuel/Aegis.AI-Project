import type { AssessmentRecord } from '@/lib/api';
import type { HistoricalIncident, Severity } from '@/lib/history/types';

const SEVERITY_MAP: Record<string, Severity> = {
  LOW: 'Safe',
  MEDIUM: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical',
  SAFE: 'Safe',
};

export const UI_TO_API_SEVERITY: Record<string, string> = {
  Safe: 'LOW',
  Moderate: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
};

export function apiSeverityToUi(severity: string): Severity {
  return SEVERITY_MAP[severity.toUpperCase()] ?? 'Safe';
}

export function recordToIncident(record: AssessmentRecord): HistoricalIncident {
  const shapVector = (record.top_shap_features ?? []).map((item) => ({
    feature: item.feature,
    value: item.impact,
  }));
  const top = [...shapVector].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return {
    id: String(record.id),
    timestamp: record.timestamp,
    endpointId: record.hostname,
    hostname: record.hostname,
    snapshot_label: record.snapshot_label,
    processName: record.snapshot_label,
    pid: record.pid,
    riskScore: record.risk_score,
    classification: record.prediction,
    severity: apiSeverityToUi(record.severity),
    shapTopContributor: top?.feature ?? '—',
    shapVector,
    actionTaken: record.recommendation,
  };
}
