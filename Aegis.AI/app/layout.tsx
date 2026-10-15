import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'AegisAI — Explainable Cybersecurity Threat Analytics',
  description:
    'Enterprise-grade explainable AI platform for real-time threat detection, SHAP-based model interpretability, and security analytics.',
  // Browser UI colour: the paper colour of each theme (--aegis-paper).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0E141B' },
  ],
  openGraph: {
    title: 'AegisAI — Explainable Cybersecurity Threat Analytics',
    description:
      'Enterprise-grade explainable AI platform for real-time threat detection and model interpretability.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/ibm-plex-sans-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/source-serif-4-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
