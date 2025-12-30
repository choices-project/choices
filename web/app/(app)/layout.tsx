'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense, useState } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';

import { usePollCreatedListener } from '@/features/polls/hooks/usePollCreatedListener';
import { ServiceWorkerProvider } from '@/features/pwa/components/ServiceWorkerProvider';

import EnhancedFeedbackWidget from '@/components/EnhancedFeedbackWidget';
import { AppShell } from '@/components/shared/AppShell';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FontProvider from '@/components/shared/FontProvider';
import GlobalNavigation from '@/components/shared/GlobalNavigation';
import SiteMessages from '@/components/SiteMessages';

import OfflineIndicator from '@/features/pwa/components/OfflineIndicator';
import PWABackground from '@/features/pwa/components/PWABackground';

import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

const DISABLE_FEEDBACK_WIDGET = process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET === '1';
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create QueryClient instance for TanStack Query with memory optimization
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Prevent unnecessary refetches
            refetchOnReconnect: false, // Prevent refetch on reconnect
          },
          mutations: {
            retry: 1, // Reduce mutation retries
          },
        },
      }),
  );

  usePollCreatedListener();

  // DIAGNOSTIC: Log when AppLayout renders AppShell (must be before early returns)
  React.useEffect(() => {
    if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
      console.warn('[DIAGNOSTIC] AppLayout: Rendering AppShell', {
        IS_E2E_HARNESS,
        bypassFlag: typeof window !== 'undefined' ? window.localStorage.getItem('e2e-dashboard-bypass') : 'SSR',
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
      });
    }
  }, []);

  if (IS_E2E_HARNESS) {
    return (
      <FontProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserStoreProvider>
              <Suspense
                fallback={
                  <div
                    data-testid="e2e-harness-loading"
                    className="p-6 text-center text-sm text-slate-500"
                  >
                    Loading harness environment…
                  </div>
                }
              >
                {children}
              </Suspense>
            </UserStoreProvider>
          </AuthProvider>
        </QueryClientProvider>
      </FontProvider>
    );
  }

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            <ServiceWorkerProvider debug={process.env.NODE_ENV === 'development'}>
              <AppShell
                navigation={<GlobalNavigation />}
                siteMessages={<SiteMessages />}
                feedback={!DISABLE_FEEDBACK_WIDGET ? <EnhancedFeedbackWidget /> : null}
              >
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
                {/* Offline and network status indicators */}
                <PWABackground />
                <OfflineIndicator />
              </AppShell>
            </ServiceWorkerProvider>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}
