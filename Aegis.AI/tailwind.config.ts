import type { Config } from 'tailwindcss';

// Theme colours live in app/globals.css as RGB channels (light in :root,
// dark in .dark) so every utility supports alpha, e.g. bg-aegis-accent/10.
const aegis = (name: string) => `rgb(var(--aegis-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Class-name maps live here too (lib/severity.ts)
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        // Page titles (serif). Body sizes use Tailwind's defaults; text-xs (12px) is the floor.
        title: ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
      },
      spacing: {
        sidebar: '15.5rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Categorical chart series (Random Forest = 1, XGBoost = 2)
        series: {
          '1': 'rgb(var(--series-1) / <alpha-value>)',
          '2': 'rgb(var(--series-2) / <alpha-value>)',
        },
        // Live terminal (dark in both themes)
        terminal: {
          bg: 'rgb(var(--terminal-bg) / <alpha-value>)',
          bar: 'rgb(var(--terminal-bar) / <alpha-value>)',
          rule: 'rgb(var(--terminal-rule) / <alpha-value>)',
          fg: 'rgb(var(--terminal-fg) / <alpha-value>)',
          muted: 'rgb(var(--terminal-muted) / <alpha-value>)',
          info: 'rgb(var(--terminal-info) / <alpha-value>)',
          ok: 'rgb(var(--terminal-ok) / <alpha-value>)',
          warn: 'rgb(var(--terminal-warn) / <alpha-value>)',
          high: 'rgb(var(--terminal-high) / <alpha-value>)',
          crit: 'rgb(var(--terminal-crit) / <alpha-value>)',
        },
        aegis: {
          // Core palette
          paper: aegis('paper'),
          surface: aegis('surface'),
          sunken: aegis('sunken'),
          ink: aegis('ink'),
          'ink-2': aegis('ink-2'),
          muted: aegis('muted'),
          rule: aegis('rule'),
          accent: aegis('accent'),
          teal: aegis('teal'),
          'on-accent': aegis('on-accent'),
          scrim: aegis('scrim'),
          // Severity scale (status/severity only)
          safe: aegis('safe'),
          moderate: aegis('moderate'),
          high: aegis('high'),
          critical: aegis('critical'),
          // Severity text placed on a tint of itself (badges)
          'safe-strong': aegis('safe-strong'),
          'moderate-strong': aegis('moderate-strong'),
          'high-strong': aegis('high-strong'),
          'critical-strong': aegis('critical-strong'),

        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
