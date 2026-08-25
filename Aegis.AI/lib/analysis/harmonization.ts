import type { AssessmentRecord } from '@/lib/api';

export const HARMONIZED_FEATURES = [
  'handles.nhandles',
  'pslist.avg_threads',
  'dlllist.ndlls',
  'malfind.commitCharge',
  'svcscan.nservices',
  'ldrmodules.not_in_load',
  'handles.nfile',
  'malfind.ninjections',
] as const;

const BENIGN: Record<string, number> = {
  'handles.nhandles': 12185.0,
  'pslist.avg_threads': 12.838,
  'dlllist.ndlls': 2086.0,
  'malfind.commitCharge': 5.0,
  'svcscan.nservices': 395.0,
  'ldrmodules.not_in_load': 74.0,
  'handles.nfile': 1079.5,
  'malfind.ninjections': 4.0,
};

const MALWARE: Record<string, number> = {
  'handles.nhandles': 8414.0,
  'pslist.avg_threads': 9.974,
  'dlllist.ndlls': 1557.0,
  'malfind.commitCharge': 1928.0,
  'svcscan.nservices': 389.0,
  'ldrmodules.not_in_load': 46.0,
  'handles.nfile': 646.0,
  'malfind.ninjections': 9.0,
};

const FEATURE_SOURCES: Record<string, { psutil: string; raw: (record: AssessmentRecord) => string }> = {
  'handles.nhandles': {
    psutil: 'open_handles (psutil)',
    raw: (record) => `${record.open_handles ?? 0} handles`,
  },
  'pslist.avg_threads': {
    psutil: 'num_threads()',
    raw: (record) => `${record.thread_count ?? 0} threads`,
  },
  'dlllist.ndlls': {
    psutil: 'memory_maps() / modules',
    raw: (record) => `${record.loaded_modules ?? 0} modules`,
  },
  'malfind.commitCharge': {
    psutil: 'memory_info().rss',
    raw: (record) => `${(record.memory_mb ?? 0).toFixed(1)} MB`,
  },
  'svcscan.nservices': {
    psutil: 'Projected from ransom intensity',
    raw: () => 'No direct psutil analogue',
  },
  'ldrmodules.not_in_load': {
    psutil: 'Projected from ransom intensity',
    raw: () => 'No direct psutil analogue',
  },
  'handles.nfile': {
    psutil: 'open_files() / nfile projection',
    raw: (record) => `${record.open_handles ?? 0} handles`,
  },
  'malfind.ninjections': {
    psutil: 'Projected from ransom intensity',
    raw: (record) => `${(record.cpu_percent ?? 0).toFixed(1)}% CPU`,
  },
};

export interface HarmonizationRow {
  psutilMetric: string;
  rawValue: string;
  forensicFeature: string;
  mappedValue: string;
  scale: number;
}

function interpolationScale(feature: string, mapped: number): number {
  const benign = BENIGN[feature];
  const malware = MALWARE[feature];
  if (benign == null || malware == null || benign === malware) {
    return 50;
  }
  const t = (mapped - benign) / (malware - benign);
  return Math.max(0, Math.min(100, Math.round(t * 100)));
}

export function buildHarmonizationRows(record: AssessmentRecord): HarmonizationRow[] {
  const vector = record.harmonized_vector ?? {};
  return HARMONIZED_FEATURES.map((feature) => {
    const mapped = Number(vector[feature] ?? 0);
    const source = FEATURE_SOURCES[feature];
    return {
      psutilMetric: source.psutil,
      rawValue: source.raw(record),
      forensicFeature: feature,
      mappedValue: mapped.toFixed(2),
      scale: interpolationScale(feature, mapped),
    };
  });
}
