import type { AssessmentRecord } from '@/lib/api';

export interface HarmonizationRow {
  key: string;
  value: number;
}

export function buildHarmonizationRows(record: AssessmentRecord): HarmonizationRow[] {
  const vector = record.harmonized_vector ?? {};
  return Object.entries(vector).map(([key, value]) => ({
    key,
    value: Number(value),
  }));
}
