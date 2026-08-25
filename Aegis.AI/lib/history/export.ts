import type { HistoricalIncident } from './types';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportIncidentsAsCsv(incidents: HistoricalIncident[]): string {
  const headers = [
    'Timestamp',
    'Endpoint ID',
    'Process Name',
    'PID',
    'Risk Score',
    'Classification',
    'Severity',
    'SHAP Top Contributor',
    'Action Taken',
  ];

  const rows = incidents.map((inc) =>
    [
      inc.timestamp,
      inc.endpointId,
      inc.processName,
      inc.pid,
      inc.riskScore,
      inc.classification,
      inc.severity,
      inc.shapTopContributor,
      inc.actionTaken,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export function exportIncidentsAsJson(incidents: HistoricalIncident[]): string {
  return JSON.stringify(incidents, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
