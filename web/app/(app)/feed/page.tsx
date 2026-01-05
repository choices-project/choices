'use client';

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
 */

import React, { useEffect, useRef, Suspense } from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';

import ClientOnly from '@/components/ClientOnly';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

function FeedContent() {
  const user = useUser();
  const userDistrict = useFormattedDistrict();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);

  // CRITICAL: Remove isMounted check - ClientOnly wrapper handles client-side rendering
  // The isMounted check was causing hydration mismatches because it conditionally rendered
  // different content on server vs client, even though ClientOnly should prevent SSR
  useEffect(() => {
    setCurrentRouteRef.current('/feed');
    setSidebarActiveSectionRef.current('feed');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Feed', href: '/feed' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  const loadingFallback = (
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
  );

  return (
    <ClientOnly fallback={loadingFallback}>
      <ErrorBoundary
        fallback={
          <div
            className="flex items-center justify-center min-h-[400px] px-4"
            data-testid="feed-error-boundary"
            role="alert"
          >
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                Unable to load feed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We encountered an error while loading your feed. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Try again to load feed"
                data-testid="feed-error-boundary-retry"
              >
                Try again
              </button>
            </div>
          </div>
        }
      >
        <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
          <Suspense fallback={loadingFallback}>
            <UnifiedFeedRefactored
              {...{
                enableAnalytics: true,
                maxItems: 50,
                userDistrict,
                ...(user?.id ? { userId: user.id } : {}),
              }}
            />
          </Suspense>
        </div>
      </ErrorBoundary>
    </ClientOnly>
  );
}

export default function FeedPage() {
  return <FeedContent />;
}
