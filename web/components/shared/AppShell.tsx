'use client';

import GlobalToastProvider from '@/components/shared/GlobalToastProvider';
import { LiveAnnouncerProvider } from '@/components/shared/LiveAnnouncer';
import MinimalNav from '@/components/shared/MinimalNav';

import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

/**
 * Minimal v0.1 layout shell: navigation + main content + toasts.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <LiveAnnouncerProvider>
      <div className="min-h-screen bg-background" data-testid="app-shell">
        <MinimalNav />
        <div className="min-h-[60vh] pb-16 md:pb-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {children}
        </div>
        <GlobalToastProvider />
      </div>
    </LiveAnnouncerProvider>
  );
}
