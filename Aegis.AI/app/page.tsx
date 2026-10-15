import Link from 'next/link';
import {
  ArrowRight,
  Terminal,
  ShieldCheck,
  BrainCircuit,
  Layers,
  Gauge,
  Cpu,
  TestTube,
  Lock,
  DollarSign,
  MemoryStick,
  EyeOff,
  Activity,
  Zap,
  Microscope,
  GraduationCap,
  Github,
} from 'lucide-react';
import { BrandMark, Wordmark } from '@/components/layout/brand-mark';
import { CapabilityGrid } from '@/components/landing/capability-grid';
import { HeroMesh } from '@/components/landing/hero-mesh';
import { HeroThreatCard } from '@/components/landing/hero-threat-card';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { ArchitectureFlow } from '@/components/landing/architecture-flow';
import { buttonClasses } from '@/components/ui-aegis/button';
import { cn } from '@/lib/utils';

const PROBLEM_POINTS = [
  {
    icon: EyeOff,
    title: 'Black-Box AI Models',
    desc: 'Legacy AI security tools flag threats without explanation, leaving analysts unable to verify or trust the verdict.',
  },
  {
    icon: DollarSign,
    title: 'Prohibitive Licensing Costs',
    desc: 'Enterprise EDR suites cost thousands per endpoint per year — out of reach for most institutions in developing economies.',
  },
  {
    icon: MemoryStick,
    title: 'Heavy Memory Overhead',
    desc: 'Traditional agents consume 500MB+ of RAM, crippling older hardware common in African and Global South environments.',
  },
  {
    icon: Lock,
    title: 'Reactive Signature Matching',
    desc: 'Signature-based detection only fires after a known threat is catalogued — useless against zero-day ransomware variants.',
  },
];

const INNOVATION_PILLARS = [
  {
    icon: Layers,
    title: 'Feature Harmonization Layer',
    desc: 'Aggregates per-process psutil measurements into the eight system-wide CIC-MalMem-2022 indicators the models expect.',
  },
  {
    icon: BrainCircuit,
    title: 'SHAP Explainability',
    desc: 'TreeExplainer attaches a ranked feature impact to every classification so an analyst can read why the model scored the snapshot.',
  },
  {
    icon: Cpu,
    title: 'Lightweight Agent',
    desc: 'A psutil agent posts one system-wide snapshot per cycle. The console only classifies and explains that snapshot.',
  },
  {
    icon: DollarSign,
    title: 'Zero-Cost Deployment',
    desc: 'Open-source stack (FastAPI, scikit-learn, Next.js) deployable on a single modest server at no licensing cost.',
  },
];

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Classification, not containment',
    desc: 'Scores a system-wide snapshot as Safe, Moderate, High, or Critical. It does not prevent, isolate, or stop an attack.',
  },
  {
    icon: BrainCircuit,
    title: 'SHAP Decision Transparency',
    desc: 'Each verdict includes the live TreeExplainer impacts for the eight harmonized indicators.',
  },
  {
    icon: Layers,
    title: 'Feature Harmonization Layer',
    desc: 'Aggregates per-process Windows measurements into system-wide indicators. A full memory dump is not required at inference time.',
  },
  {
    icon: Zap,
    title: 'FastAPI assessment',
    desc: 'The gateway harmonizes the eight indicators, scores them with Random Forest and XGBoost, and returns SHAP.',
  },
  {
    icon: Gauge,
    title: 'Endpoint snapshot agent',
    desc: 'The Python agent collects accessible processes and posts one system-wide snapshot. It does not act on the host.',
  },
  {
    icon: TestTube,
    title: 'Interactive Viva Sandbox',
    desc: 'Posts synthetic system-wide snapshots to the same assess endpoint used by the live agent.',
  },
];

const PLATFORM_LINKS = [
  { label: 'Research Evaluation', href: '/research' },
  { label: 'Executive Overview', href: '/dashboard' },
  { label: 'Threat Analysis', href: '/analysis' },
  { label: 'Historical Analytics', href: '/history' },
  { label: 'Scenario Sandbox', href: '/sandbox' },
];

/** Major sections are separated by a rule: 64px of rhythm on mobile, 96px on desktop. */
const SECTION = 'mt-8 border-t border-aegis-rule pt-8 lg:mt-12 lg:pt-12';

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-10 max-w-[65ch]">
      <p className="text-sm font-medium text-aegis-muted">{eyebrow}</p>
      <h2 className="mt-2 text-[1.75rem] leading-tight text-aegis-ink lg:text-[2rem]">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-aegis-muted">{children}</p>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="max-w-[1200px] pb-4">
      {/* ─────────────────────────── 1. HERO ─────────────────────────── */}
      <StaggerGroup
        as="section"
        className="relative isolate grid items-start gap-12 pb-8 pt-2 lg:pb-12 lg:pt-6 xl:grid-cols-[minmax(0,1fr)_28rem] xl:gap-14"
      >
        <HeroMesh />

        {/* Left: copy + CTAs */}
        <div>
          <StaggerItem as="p" className="text-sm text-aegis-muted">
            Decision-support console • Explainable AI + Memory Forensics
          </StaggerItem>

          <StaggerItem as="h1" className="mt-4 max-w-[20ch] text-[2.25rem] leading-[1.12] text-aegis-ink sm:text-[2.75rem] 2xl:text-[3.25rem]">
            Proactive Behavioral Ransomware Detection Powered by Explainable AI
          </StaggerItem>

          <StaggerItem as="p" className="mt-6 max-w-[65ch] text-base leading-relaxed text-aegis-ink-2 lg:text-[1.0625rem]">
            Models are trained on the CIC-MalMem-2022 memory-forensic dataset and
            scored against live Windows endpoint telemetry. A Feature Harmonization
            Layer aggregates per-process measurements into system-wide indicators.
            TreeExplainer SHAP explains each classification. AegisAI is
            decision-support only: it classifies and explains, and it does not
            prevent, isolate, or stop an attack. Near-perfect benchmark accuracy
            reflects the high separability of the dataset, and live performance is
            evaluated separately.
          </StaggerItem>

          <StaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={buttonClasses('primary', 'md', 'h-auto px-5 py-2.5')}
            >
              Launch Analytics Console
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sandbox"
              className={buttonClasses('secondary', 'md', 'h-auto px-5 py-2.5')}
            >
              <Terminal className="h-4 w-4" aria-hidden="true" />
              Explore Scenario Sandbox
            </Link>
          </StaggerItem>

          {/* Trust indicators */}
          <StaggerItem as="ul" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-aegis-muted">
            <li className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 shrink-0" aria-hidden="true" />
              CIC-MalMem-2022 benchmark
            </li>
            <li className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              Decision-support mode
            </li>
            <li className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
              8 system-wide indicators
            </li>
          </StaggerItem>
        </div>

        {/* Right: illustrative figure */}
        <StaggerItem className="xl:pt-1">
          <HeroThreatCard />
        </StaggerItem>
      </StaggerGroup>

      {/* ─────────────────────── 2. PROBLEM & INNOVATION ─────────────── */}
      <Reveal className={SECTION}>
        <SectionHeader eyebrow="Problem & Innovation" title="Why Traditional EDR Falls Short">
          Legacy endpoint security was built for well-resourced enterprises.
          AegisAI rethinks the model for resource-constrained environments.
        </SectionHeader>

        <div className="grid divide-y divide-aegis-rule lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Problem */}
          <div className="pb-8 lg:pb-0 lg:pr-10">
            <h3 className="text-lg text-aegis-ink">The Problem with Traditional EDR</h3>
            <ul className="mt-4 divide-y divide-aegis-rule border-t border-aegis-rule">
              {PROBLEM_POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.title} className="flex items-start gap-3 py-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-aegis-critical" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-aegis-ink">{p.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-aegis-muted">{p.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Innovation */}
          <div className="pt-8 lg:pl-10 lg:pt-0">
            <h3 className="text-lg text-aegis-ink">The AegisAI Innovation</h3>
            <ul className="mt-4 grid gap-px border-t border-aegis-rule bg-aegis-rule sm:grid-cols-2">
              {INNOVATION_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <li key={pillar.title} className="bg-aegis-paper py-4 sm:odd:pr-5 sm:even:pl-5">
                    <Icon className="h-4 w-4 text-aegis-accent" aria-hidden="true" />
                    <p className="mt-2 text-sm font-semibold text-aegis-ink">{pillar.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-aegis-muted">{pillar.desc}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* ─────────────────────── 3. ARCHITECTURE WORKFLOW ────────────── */}
      <Reveal className={SECTION}>
        <SectionHeader eyebrow="Architecture Workflow" title="End-to-End Detection Pipeline">
          From the endpoint agent to the analyst console. Click a stage. Traffic
          moves one way and never returns a control command to the host.
        </SectionHeader>

        <ArchitectureFlow />
      </Reveal>

      {/* ─────────────────────── 4. KEY CAPABILITIES ──────────────────── */}
      <Reveal className={SECTION}>
        <SectionHeader eyebrow="Key Research Capabilities" title="Six Core Capabilities">
          Each capability is designed, measured, and validated against the
          constraints of real-world, resource-limited deployments.
        </SectionHeader>

        <CapabilityGrid>
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <li key={cap.title} className="lift bg-aegis-surface p-6">
                <Icon className="h-5 w-5 text-aegis-ink-2" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-3 font-sans text-base font-semibold tracking-normal text-aegis-ink">
                  {cap.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-aegis-muted">{cap.desc}</p>
              </li>
            );
          })}
        </CapabilityGrid>
      </Reveal>

      {/* ─────────────────────── 5. FOOTER ────────────────────────────── */}
      <Reveal as="footer" className={cn(SECTION, 'text-sm')}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-7 w-7" />
              <span className="flex flex-col">
                <Wordmark />
                <span className="text-xs leading-tight text-aegis-muted">Threat Analytics</span>
              </span>
            </div>
            <p className="mt-4 leading-relaxed text-aegis-muted">
              An explainable ransomware classification console developed as part
              of a BSc Honours Data Science dissertation at Midlands State
              University. It classifies snapshots and explains them. It does not
              prevent, isolate, or stop an attack.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Platform">
            <p className="font-semibold text-aegis-ink-2">Platform</p>
            <ul className="mt-3 space-y-2">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="rounded-sm text-aegis-muted underline-offset-4 transition-colors hover:text-aegis-accent hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tech stack */}
          <div>
            <p className="font-semibold text-aegis-ink-2">Technology Stack</p>
            <ul className="mt-3 space-y-2 text-aegis-muted">
              <li>Next.js 14 · App Router</li>
              <li>FastAPI · scikit-learn · XGBoost</li>
              <li>SHAP TreeExplainer</li>
              <li>psutil Endpoint Agent</li>
              <li>Recharts · Tailwind CSS</li>
            </ul>
          </div>

          {/* Academic credit */}
          <div>
            <p className="font-semibold text-aegis-ink-2">Academic Credentials</p>
            <ul className="mt-3 space-y-3 text-aegis-muted">
              <li className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">
                  Midlands State University — Department of Information and
                  Marketing Sciences
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Microscope className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">
                  BSc Honours Dissertation — 2026 Academic Year
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Github className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">
                  Open-source research project · MIT License
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-aegis-rule pt-6 text-xs text-aegis-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AegisAI · Midlands State University Data Science Research</p>
          <p>Built in accordance with MSU dissertation guidelines</p>
        </div>
      </Reveal>
    </div>
  );
}
