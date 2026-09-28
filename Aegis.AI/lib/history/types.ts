/** Mirrors db/schemas/postgres.sql & sqlite.sql incident_logs + shap_explanations */

export type Severity = 'Safe' | 'Moderate' | 'High' | 'Critical';

export type DateRangePreset = '24h' | '7d' | 'custom';

export interface ShapEntry {
  feature: string;
  value: number;
}

export interface HistoricalIncident {
  id: string;
  timestamp: string;
  endpointId: string;
  hostname?: string;
  snapshot_label?: string;
  processName: string;
  pid: number;
  riskScore: number;
  classification: string;
  severity: Severity;
  shapTopContributor: string;
  shapVector: ShapEntry[];
  actionTaken: string;
}

export interface ThreatFrequencyPoint {
  label: string;
  alerts: number;
}

export interface RiskScoreComparisonPoint {
  label: string;
  benign: number;
  malicious: number;
}
