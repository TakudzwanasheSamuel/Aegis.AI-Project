import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AegisAI — Explainable Cybersecurity Threat Analytics',
  description:
    'Enterprise-grade explainable AI platform for real-time threat detection, SHAP-based model interpretability, and security analytics.',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
