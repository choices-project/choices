/**
 * Dashboard Page - Uses Client-Only DashboardContent Component
 *
 * This page uses a client-only DashboardContent component to prevent hydration mismatches.
 * All complex logic is in DashboardContent, which is dynamically imported with ssr: false.
 *
 * Fixed: January 2025 - Extracted page logic to DashboardContent with dynamic import
 * This prevents hydration mismatches by ensuring the component never renders on the server
 * 
 * CRITICAL: This is a Server Component (no 'use client'), similar to feed page.
 * The page component itself doesn't need to be a Client Component since DashboardContent
 * is dynamically imported with ssr: false. Making this a Server Component prevents
 * the page component from being included in the client bundle, reducing hydration complexity.
 */

import dynamicImport from 'next/dynamic';

// CRITICAL: Load DashboardContent only on client to prevent SSR hydration mismatch
// This component uses hooks and client-side state that cause React Error #185 when rendered during SSR
// Similar to how feed page handles it - extract all logic to client-only component
const DashboardContent = dynamicImport(
  () => import('./DashboardContent'),
  {
    ssr: false,
    loading: () => (
      <>
        {/* CRITICAL: Loading fallback must match DashboardContent structure exactly */}
        {/* DashboardContent renders DashboardNavigation first, then content */}
        {/* This ensures server-rendered HTML matches what React expects during hydration */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" data-testid="dashboard-nav-loading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="space-y-6"
            aria-label="Loading dashboard"
            aria-busy="true"
            aria-live="polite"
            data-testid="dashboard-loading-skeleton"
            role="status"
          >
            <div className="animate-pulse">
              {/* Header skeleton */}
              <div className="mb-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>

              {/* Metrics cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                ))}
              </div>

              {/* Content cards skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  }
);

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  // CRITICAL: This page component is now minimal and just imports DashboardContent
  // DashboardContent is dynamically imported with ssr: false, so it never renders on the server
  // This prevents hydration mismatches by ensuring server and client render the same (just the loading fallback)
  
  // #region agent log - Track server vs client rendering
  if (typeof window !== 'undefined') {
    const logData = {
      location: 'dashboard/page.tsx:render',
      message: 'DashboardPage rendering on CLIENT',
      data: {
        isServer: false,
        timestamp: Date.now(),
        htmlAttrs: {
          theme: document.documentElement.getAttribute('data-theme'),
          collapsed: document.documentElement.getAttribute('data-sidebar-collapsed'),
          width: document.documentElement.getAttribute('data-sidebar-width'),
          pinned: document.documentElement.getAttribute('data-sidebar-pinned'),
        },
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H15',
    };
    console.log('[DEBUG]', JSON.stringify(logData));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch(() => {});
  }
  // #endregion
  
  return <DashboardContent />;
}
