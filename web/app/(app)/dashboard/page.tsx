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
      // H37: Restore matching structure - loading fallback must match DashboardContent exactly
      // DashboardContent renders: div > DashboardNavigation (nav) > div (content) > MobileDashboardNav (nav)
      // The bailout template replaces this, but React may try to hydrate the loading fallback first
      // If structures don't match, React detects mismatch and throws error #185
      <div>
        {/* DashboardNavigation placeholder */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" data-testid="dashboard-nav-loading" aria-hidden="true">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </nav>
        {/* Content skeleton */}
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
        {/* MobileDashboardNav placeholder */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50" data-testid="mobile-dashboard-nav-loading" aria-hidden="true">
          <div className="flex items-center justify-around">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3 px-4 flex-1">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </nav>
      </div>
    ),
  }
);

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  // CRITICAL: This page component is now minimal and just imports DashboardContent
  // DashboardContent is dynamically imported with ssr: false, so it never renders on the server
  // This prevents hydration mismatches by ensuring server and client render the same (just the loading fallback)
  // H32: Removed client-side code from Server Component - Server Components must be pure and cannot access window/document
  // This was causing hydration mismatch because server and client rendered different code paths
  // H37: Loading fallback structure restored to match DashboardContent exactly (div > nav > div > nav)
  // AuthGuard is handled inside DashboardContent (client component)
  // Middleware also protects this route server-side
  
  return <DashboardContent />;
}
