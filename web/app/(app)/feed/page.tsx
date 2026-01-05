/**
 * Feed Page - Uses Restored UnifiedFeed Component
 *
 * This page now uses the fully restored UnifiedFeed component
 * with all features enabled.
 *
 * Features:
 * - District-based filtering (opt-in)
 * - Hashtag filtering
 * - Pull-to-refresh
 * - Infinite scroll
 *
 * Fixed: November 5, 2025 - E2E tests revealed this was using a placeholder
 * Enhanced: November 5, 2025 - Added district filtering UI
 * Fixed: December 11, 2025 - Added client-side only rendering to prevent hydration errors
 * Fixed: January 2025 - Replaced custom ErrorBoundary with shared ErrorBoundary that handles hydration errors
 * Fixed: January 3, 2026 - Changed to dynamic import with ssr: false to prevent hydration mismatches
 */

import dynamicImport from 'next/dynamic';

// CRITICAL: Load FeedContent only on client to prevent SSR hydration mismatch
// This component uses hooks and client-side state that cause React Error #185 when rendered during SSR
const FeedContent = dynamicImport(
  () => import('./FeedContent'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div
          className="space-y-4"
          aria-label="Loading feeds"
          aria-busy="true"
          aria-live="polite"
          data-testid="feed-loading-skeleton"
          role="status"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse" aria-hidden="true">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

export default function FeedPage() {
  return <FeedContent />;
}
