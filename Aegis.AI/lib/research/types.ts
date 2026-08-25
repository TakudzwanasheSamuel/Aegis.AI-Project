export interface MethodologyCard {
  title: string;
  headline: string;
  details: string[];
  icon: 'dataset' | 'features' | 'validation';
}

export interface ModelBenchmarkRow {
  algorithm: string;
  role: 'primary' | 'benchmark' | 'baseline';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  inferenceLatencyMs: number;
}

export interface ConfusionMatrixData {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface RocCurvePoint {
  fpr: number;
  tprRandomForest: number;
  tprXgboost: number;
}

export interface FeatureImportanceEntry {
  feature: string;
  importance: number;
}

export interface ClassDistributionEntry {
  label: string;
  preSmoteBenign: number;
  preSmoteMalware: number;
  postSmoteBenign: number;
  postSmoteMalware: number;
}
