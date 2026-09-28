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
import { HeroThreatCard } from '@/components/landing/hero-threat-card';
import { ArchitectureFlow } from '@/components/landing/architecture-flow';

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
    accent: '#6366F1',
  },
  {
    icon: BrainCircuit,
    title: 'SHAP Decision Transparency',
    desc: 'Each verdict includes the live TreeExplainer impacts for the eight harmonized indicators.',
    accent: '#22D3EE',
  },
  {
    icon: Layers,
    title: 'Feature Harmonization Layer',
    desc: 'Aggregates per-process Windows measurements into system-wide indicators. A full memory dump is not required at inference time.',
    accent: '#10B981',
  },
  {
    icon: Zap,
    title: 'FastAPI assessment',
    desc: 'The gateway harmonizes the eight indicators, scores them with Random Forest and XGBoost, and returns SHAP.',
    accent: '#F59E0B',
  },
  {
    icon: Gauge,
    title: 'Endpoint snapshot agent',
    desc: 'The Python agent collects accessible processes and posts one system-wide snapshot. It does not act on the host.',
    accent: '#3B82F6',
  },
  {
    icon: TestTube,
    title: 'Interactive Viva Sandbox',
    desc: 'Posts synthetic system-wide snapshots to the same assess endpoint used by the live agent.',
    accent: '#DC2626',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-16">
      {/* ─────────────────────────── 1. HERO ─────────────────────────── */}
      <section className="relative overflow-hidden rounded-card">
        {/* Deep indigo gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #1E1B4B 0%, #0F172A 45%, #020617 100%)',
          }}
        />
        {/* Radial accent glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 500px 300px at 15% 20%, rgba(99,102,241,0.25), transparent), radial-gradient(ellipse 400px 250px at 85% 80%, rgba(34,211,238,0.18), transparent)',
          }}
        />
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative grid items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-16 lg:py-24">
          {/* Left: copy + CTAs */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-4 py-1.5 backdrop-blur-md">
              <span className="text-sm">🚀</span>
              <span className="text-xs font-medium tracking-wide text-aegis-text-secondary">
                Decision-support console • Explainable AI + Memory Forensics
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white lg:text-5xl xl:text-6xl">
              Proactive Behavioral Ransomware Detection Powered by{' '}
              <span className="text-gradient">Explainable AI</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-aegis-text-secondary lg:text-lg">
              Models are trained on the CIC-MalMem-2022 memory-forensic dataset and
              scored against live Windows endpoint telemetry. A Feature Harmonization
              Layer aggregates per-process measurements into system-wide indicators.
              TreeExplainer SHAP explains each classification. AegisAI is
              decision-support only: it classifies and explains, and it does not
              prevent, isolate, or stop an attack. Near-perfect benchmark accuracy
              reflects the high separability of the dataset, and live performance is
              evaluated separately.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="btn-gradient flex items-center justify-center gap-2 rounded-button px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              >
                Launch Analytics Console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sandbox"
                className="glass-panel flex items-center justify-center gap-2 rounded-button px-7 py-3.5 text-sm font-semibold text-aegis-text-primary transition-colors hover:bg-white/[0.06]"
              >
                <Terminal className="h-4 w-4 text-aegis-accent-secondary" />
                Explore Scenario Sandbox
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-aegis-text-muted">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-aegis-success" />
                CIC-MalMem-2022 benchmark
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-aegis-accent-secondary" />
                Decision-support mode
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-aegis-info" />
                8 system-wide indicators
              </span>
            </div>
          </div>

          {/* Right: floating mock card */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-fade-in [animation-delay:200ms]">
              <HeroThreatCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── 2. PROBLEM & INNOVATION ─────────────── */}
      <section>
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aegis-accent-secondary">
            Problem & Innovation
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-aegis-text-primary lg:text-4xl">
            Why Traditional EDR Falls Short
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-aegis-text-muted">
            Legacy endpoint security was built for well-resourced enterprises.
            AegisAI rethinks the model for resource-constrained environments.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Problem card */}
          <div className="surface-card rounded-card p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aegis-danger/10 border border-aegis-danger/20">
                <EyeOff className="h-5 w-5 text-aegis-danger" />
              </div>
              <h3 className="text-lg font-bold text-aegis-text-primary">
                The Problem with Traditional EDR
              </h3>
            </div>
            <div className="space-y-5">
              {PROBLEM_POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aegis-danger/5 border border-aegis-danger/10">
                      <Icon className="h-4 w-4 text-aegis-danger" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-aegis-text-primary">
                        {p.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-aegis-text-muted">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Innovation card */}
          <div className="surface-card rounded-card p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aegis-accent-primary/10 border border-aegis-accent-primary/20">
                <BrainCircuit className="h-5 w-5 text-aegis-accent-primary" />
              </div>
              <h3 className="text-lg font-bold text-aegis-text-primary">
                The AegisAI Innovation
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {INNOVATION_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                  >
                    <Icon className="h-5 w-5 text-aegis-accent-secondary" />
                    <p className="mt-3 text-sm font-semibold text-aegis-text-primary">
                      {pillar.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-aegis-text-muted">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── 3. ARCHITECTURE WORKFLOW ────────────── */}
      <section>
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aegis-accent-secondary">
            Architecture Workflow
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-aegis-text-primary lg:text-4xl">
            End-to-End Detection Pipeline
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-aegis-text-muted">
            From the endpoint agent to the analyst console. Click a stage. Traffic
            moves one way and never returns a control command to the host.
          </p>
        </div>

        <ArchitectureFlow />
      </section>

      {/* ─────────────────────── 4. KEY CAPABILITIES ──────────────────── */}
      <section>
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aegis-accent-secondary">
            Key Research Capabilities
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-aegis-text-primary lg:text-4xl">
            Six Core Capabilities
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-aegis-text-muted">
            Each capability is designed, measured, and validated against the
            constraints of real-world, resource-limited deployments.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="group surface-card rounded-card p-6 transition-all duration-300 hover:border-white/[0.12] hover:shadow-glow-primary"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${cap.accent}1a`,
                    borderColor: `${cap.accent}30`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: cap.accent }} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-aegis-text-primary">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-aegis-text-muted">
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── 5. FOOTER ────────────────────────────── */}
      <footer className="border-t border-white/[0.06] pt-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aegis-accent-primary to-aegis-accent-secondary shadow-glow-primary">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-gradient">AegisAI</span>
                <p className="text-[10px] uppercase tracking-wider text-aegis-text-muted">
                  Threat Analytics
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-aegis-text-muted">
              An explainable ransomware classification console developed as part
              of a BSc Honours Data Science dissertation at Midlands State
              University. It classifies snapshots and explains them. It does not
              prevent, isolate, or stop an attack.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-aegis-text-secondary">
              Platform
            </p>
            <ul className="mt-4 space-y-2">
              {[
                { label: 'Research Evaluation', href: '/research' },
                { label: 'Executive Overview', href: '/dashboard' },
                { label: 'Threat Analysis', href: '/analysis' },
                { label: 'Scenario Sandbox', href: '/sandbox' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs text-aegis-text-muted transition-colors hover:text-aegis-accent-secondary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-aegis-text-secondary">
              Technology Stack
            </p>
            <ul className="mt-4 space-y-2 text-xs text-aegis-text-muted">
              <li>Next.js 14 · App Router</li>
              <li>FastAPI · scikit-learn · XGBoost</li>
              <li>SHAP TreeExplainer</li>
              <li>psutil Endpoint Agent</li>
              <li>Recharts · Tailwind CSS</li>
            </ul>
          </div>

          {/* Academic credit */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-aegis-text-secondary">
              Academic Credentials
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-aegis-accent-primary" />
                <p className="text-xs leading-relaxed text-aegis-text-muted">
                  Midlands State University — Department of Data Science &
                  Informatics
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Microscope className="mt-0.5 h-4 w-4 shrink-0 text-aegis-accent-secondary" />
                <p className="text-xs leading-relaxed text-aegis-text-muted">
                  BSc Honours Dissertation — 2025 Academic Year
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Github className="mt-0.5 h-4 w-4 shrink-0 text-aegis-text-muted" />
                <p className="text-xs leading-relaxed text-aegis-text-muted">
                  Open-source research project · MIT License
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-6 sm:flex-row">
          <p className="text-[11px] text-aegis-text-muted">
            © 2025 AegisAI · Midlands State University Data Science Research
          </p>
          <p className="text-[11px] text-aegis-text-muted">
            Built in accordance with MSU dissertation guidelines
          </p>
        </div>
      </footer>
    </div>
  );
}
