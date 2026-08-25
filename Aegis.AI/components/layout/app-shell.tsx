'use client';

import { useState } from 'react';

import { GatewayStatusProvider } from '@/components/layout/gateway-status';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-aegis-bg-primary text-aegis-text-primary">
      <GatewayStatusProvider>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="lg:pl-72">
          <Header onMenuClick={() => setMobileOpen(true)} />

          <main className="px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1600px] animate-fade-in">{children}</div>
          </main>
        </div>
      </GatewayStatusProvider>
    </div>
  );
}
