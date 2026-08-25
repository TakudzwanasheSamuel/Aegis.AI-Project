import type { MethodologyCard } from './types';

export const METHODOLOGY_CARDS: MethodologyCard[] = [
  {
    title: 'Benchmark Dataset',
    headline: 'CIC-MalMem-2022',
    details: [
      '58,596 total memory dump samples',
      '50% Benign / 50% Malware class distribution',
      'Canadian Institute for Cybersecurity (CIC) corpus',
    ],
    icon: 'dataset',
  },
  {
    title: 'Feature Matrix',
    headline: '8 Harmonized Features',
    details: [
      'Mapped from CIC-MalMem-2022 (58,596 samples)',
      'Process handle, thread, DLL, and malfind signals',
      'Live psutil telemetry projected onto this 8-column space',
    ],
    icon: 'features',
  },
  {
    title: 'Validation Strategy',
    headline: 'Held-out test evaluation',
    details: [
      '80/20 Train/Test Split',
      'SMOTE on the training fold (already class-balanced)',
      'StandardScaler before Random Forest and XGBoost',
    ],
    icon: 'validation',
  },
];
