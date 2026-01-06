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
// CRITICAL: Loading fallback must match the actual component structure to prevent hydration mismatches
// GlobalNavigation renders a <div> wrapper with <nav> inside, so loading fallback must match
const GlobalNavigation = dynamicImport(() => import('@/components/shared/GlobalNavigation'), {
  ssr: false,
  loading: () => (
    <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700" data-testid="global-nav-loading">
      <nav className="bg-white dark:bg-gray-900" aria-label="Primary navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    </div>
  ),
});

// CRITICAL: These components use ssr: false, but their containers in AppShell are server-rendered
// The loading fallback must be consistent to prevent hydration mismatches
// Using empty divs instead of null to maintain consistent DOM structure
const EnhancedFeedbackWidget = dynamicImport(() => import('@/components/EnhancedFeedbackWidget'), {
  ssr: false,
  loading: () => <div style={{ display: 'none' }} aria-hidden="true" />,
});

const SiteMessages = dynamicImport(() => import('@/components/SiteMessages'), {
  ssr: false,
  loading: () => <div style={{ display: 'none' }} aria-hidden="true" />,
});


import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

const DISABLE_FEEDBACK_WIDGET = process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET === '1';
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL: Set attributes SYNCHRONOUSLY before any children render
  // This ensures attributes exist before React hydrates children
  // We use a ref to ensure this only runs once per component instance
  const attributesSetRef = React.useRef(false);
  if (typeof document !== 'undefined' && !attributesSetRef.current) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed');
    const currentWidth = document.documentElement.getAttribute('data-sidebar-width');
    const currentPinned = document.documentElement.getAttribute('data-sidebar-pinned');
    
    // Always ensure attributes exist - even if ThemeScript set them, we ensure they're present
    // This is critical for client-side navigation where ThemeScript doesn't run
    const themeToSet = currentTheme || 'light';
    const collapsedToSet = currentCollapsed !== null ? currentCollapsed : 'false';
    const widthToSet = currentWidth || '280';
    const pinnedToSet = currentPinned !== null ? currentPinned : 'false';
    
    document.documentElement.setAttribute('data-theme', themeToSet);
    document.documentElement.setAttribute('data-sidebar-collapsed', collapsedToSet);
    document.documentElement.setAttribute('data-sidebar-width', widthToSet);
    document.documentElement.setAttribute('data-sidebar-pinned', pinnedToSet);
    
    if (themeToSet === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    
    // Force synchronous reflow
    void document.documentElement.offsetHeight;
    attributesSetRef.current = true;
  }

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

  // #region agent log - Capture hydration errors with timing
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Track when React starts hydrating
    const hydrationStartTime = Date.now();
    const logHydrationStart={location:'AppLayout.tsx:hydrationStart',message:'React hydration starting',data:{pathname:window.location.pathname,timestamp:hydrationStartTime,htmlAttrs:{theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'};
    console.log('[DEBUG]',JSON.stringify(logHydrationStart));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logHydrationStart)}).catch(()=>{});
    
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const errorStr = args.map(a => String(a)).join(' ');
      if (errorStr.includes('185') || errorStr.includes('hydration') || errorStr.includes('Hydration')) {
        const hydrationErrorTime = Date.now();
        const timeSinceStart = hydrationErrorTime - hydrationStartTime;
        
        // Capture the full error details including stack trace
        const errorDetails = args.map(arg => {
          if (arg instanceof Error) {
            return {
              message: arg.message,
              stack: arg.stack,
              name: arg.name,
            };
          }
          return String(arg);
        });
        
        // Check if attributes exist RIGHT NOW (synchronously)
        const attrsNow = {
          'data-theme': document.documentElement.getAttribute('data-theme'),
          'data-sidebar-collapsed': document.documentElement.getAttribute('data-sidebar-collapsed'),
          'data-sidebar-width': document.documentElement.getAttribute('data-sidebar-width'),
          'data-sidebar-pinned': document.documentElement.getAttribute('data-sidebar-pinned'),
        };
        
        const logData = {
          location: 'AppLayout.tsx:useEffect',
          message: 'Hydration error detected in console',
          data: {
            error: errorStr,
            errorDetails: errorDetails,
            pathname: window.location.pathname,
            timestamp: hydrationErrorTime,
            timeSinceHydrationStart: timeSinceStart,
            domState: {
              htmlAttrs: attrsNow,
              htmlAttrsAtHydrationStart: {
                'data-theme': 'light', // From hydrationStart log
                'data-sidebar-collapsed': 'false',
                'data-sidebar-width': '280',
                'data-sidebar-pinned': 'false',
              },
              appShell: document.querySelector('[data-testid="app-shell"]') ? {
                className: document.querySelector('[data-testid="app-shell"]')?.className,
                children: document.querySelector('[data-testid="app-shell"]')?.children.length,
              } : null,
              globalNav: document.querySelector('[data-testid="global-nav-loading"]') ? 'loading' : document.querySelector('nav') ? 'rendered' : 'none',
            }
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H8'
        };
        console.log('[DEBUG]', JSON.stringify(logData));
        fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
  // #endregion

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
