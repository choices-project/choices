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
 */

import React, { useEffect, useState, useRef, Suspense, Component, type ReactNode } from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import logger from '@/lib/utils/logger';

// Error boundary wrapper to catch feed component errors
class ErrorBoundaryWrapper extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Feed component error:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex items-center justify-center min-h-[400px]"
          data-testid="feed-error-boundary"
          role="alert"
        >
          <div className="text-center">
            <div className="mb-4">
              <svg className="h-12 w-12 mx-auto text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-600 font-medium mb-2">Unable to load feed</p>
              <p className="text-gray-600 text-sm mb-4">We encountered an error while loading your feed. Please try again.</p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                // Retry by resetting error state - component will re-render and attempt to load again
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Try again to load feed"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

function FeedContent() {
  const user = useUser();
  const userDistrict = useFormattedDistrict();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [isMounted, setIsMounted] = useState(false);

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
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
  }, [isMounted]);  

  // Prevent hydration mismatch by only rendering content after mount
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div 
          className="space-y-4" 
          aria-label="Loading feeds"
          aria-busy="true"
          data-testid="feed-loading-skeleton"
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
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
      <Suspense
        fallback={
          <div 
            className="space-y-4" 
            aria-label="Loading feeds"
            aria-busy="true"
            data-testid="feed-loading-skeleton"
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
        }
      >
        <ErrorBoundaryWrapper>
          <UnifiedFeedRefactored
            {...{
              enableAnalytics: true,
              maxItems: 50,
              userDistrict,
              ...(user?.id ? { userId: user.id } : {}),
            }}
          />
        </ErrorBoundaryWrapper>
      </Suspense>
    </div>
  );
}

export default function FeedPage() {
  return <FeedContent />;
}
