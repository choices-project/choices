'use client';

import React, { useEffect, useRef, Suspense } from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

// NOTE: This is a client component ('use client'), so we don't need 'export const dynamic'
// The parent page uses dynamic import with ssr: false, which prevents SSR

export default function FeedContent() {
  // #region agent log - Track FeedContent render
  const renderTime = Date.now();
  const isClient = typeof window !== 'undefined';
  const htmlAttrsAtRender = isClient ? {
    theme: document.documentElement.getAttribute('data-theme'),
    collapsed: document.documentElement.getAttribute('data-sidebar-collapsed'),
    width: document.documentElement.getAttribute('data-sidebar-width'),
    pinned: document.documentElement.getAttribute('data-sidebar-pinned'),
  } : null;
  if (process.env.DEBUG_DASHBOARD === '1') {
    logger.debug('FeedContent component rendering', {
      pathname: isClient ? window.location.pathname : 'SSR',
      isClient,
      htmlAttrs: htmlAttrsAtRender,
    });
  }
  // #endregion

  const user = useUser();
  const userDistrict = useFormattedDistrict();

  // #region agent log - Track FeedContent hydration
  React.useEffect(() => {
    const mountTime = Date.now();
    const htmlAttrsAtMount = typeof document !== 'undefined' ? {
      theme: document.documentElement.getAttribute('data-theme'),
      collapsed: document.documentElement.getAttribute('data-sidebar-collapsed'),
      width: document.documentElement.getAttribute('data-sidebar-width'),
      pinned: document.documentElement.getAttribute('data-sidebar-pinned'),
    } : null;
    if (process.env.DEBUG_DASHBOARD === '1') {
      logger.debug('FeedContent component mounted/hydrated', {
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
        timeSinceRender: mountTime - renderTime,
        hasUser: !!user,
        userDistrict,
        htmlAttrsAtMount,
        htmlAttrsAtRender,
      });
    }
  }, [user, userDistrict]);
  // #endregion
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);

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
      <main className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
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
      </main>
    </ErrorBoundary>
  );
}

