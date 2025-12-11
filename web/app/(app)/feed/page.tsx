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

import React, { useEffect, useState, Suspense } from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';
import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

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
  );
}

export default function FeedPage() {
  return <FeedContent />;
}
