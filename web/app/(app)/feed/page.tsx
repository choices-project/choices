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

import React, { useEffect, useState, Suspense, Component, type ReactNode } from 'react';

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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Unable to load feed. Please refresh the page.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    setCurrentRoute('/feed');
    setSidebarActiveSection('feed');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Feed', href: '/feed' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [isMounted, setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // Prevent hydration mismatch by only rendering content after mount
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-500">Loading feed...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-gray-500">Loading feed...</div>
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
