'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';

import { GatewayStatusProvider } from '@/components/layout/gateway-status';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { transition } from '@/lib/motion';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-aegis-paper text-aegis-ink">
        <GatewayStatusProvider>
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

          <div className="lg:pl-sidebar">
            <Header onMenuClick={() => setMobileOpen(true)} />

            <main className="px-4 py-6 lg:px-8 lg:py-8">
              {/* Route content fades in with an 8px rise on each navigation. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  className="mx-auto max-w-[1600px]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={transition.base}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </GatewayStatusProvider>
      </div>
    </MotionConfig>
  );
}
