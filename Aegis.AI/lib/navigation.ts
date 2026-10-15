import {
  LayoutDashboard,
  BrainCircuit,
  Terminal,
  BarChart3,
  Database,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavRoute {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const navRoutes: NavRoute[] = [
  {
    label: 'Landing Page',
    href: '/',
    icon: ShieldCheck,
    description: 'Platform overview & entry point',
  },
  {
    label: 'Research Evaluation',
    href: '/research',
    icon: BarChart3,
    description: 'Model performance & benchmark reports',
  },
  {
    label: 'Executive Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Real-time threat posture & KPIs',
  },
  {
    label: 'Threat Analysis & SHAP',
    href: '/analysis',
    icon: BrainCircuit,
    description: 'Model explainability & feature attribution',
  },
  {
    label: 'Historical Analytics',
    href: '/history',
    icon: Database,
    description: 'Persisted incident logs & SHAP audit trails',
  },
  {
    label: 'Scenario Sandbox',
    href: '/sandbox',
    icon: Terminal,
    description: 'Simulated attack scenarios & testing',
  },
];
