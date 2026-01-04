'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamicImport from 'next/dynamic';
import React, { Suspense, useState } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';

import { usePollCreatedListener } from '@/features/polls/hooks/usePollCreatedListener';
import OfflineIndicator from '@/features/pwa/components/OfflineIndicator';
import PWABackground from '@/features/pwa/components/PWABackground';
import { ServiceWorkerProvider } from '@/features/pwa/components/ServiceWorkerProvider';

import { AppShell } from '@/components/shared/AppShell';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FontProvider from '@/components/shared/FontProvider';

// Dynamically import components that use usePathname() to prevent hydration errors
// ssr: false ensures they only render on the client
const GlobalNavigation = dynamicImport(() => import('@/components/shared/GlobalNavigation'), {
  ssr: false,
  loading: () => (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700" data-testid="global-nav-loading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </nav>
  ),
});

const EnhancedFeedbackWidget = dynamicImport(() => import('@/components/EnhancedFeedbackWidget'), {
  ssr: false,
  loading: () => null,
});

const SiteMessages = dynamicImport(() => import('@/components/SiteMessages'), {
  ssr: false,
  loading: () => null,
});


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
                feedback={
                  !DISABLE_FEEDBACK_WIDGET ? <EnhancedFeedbackWidget /> : null
                }
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
