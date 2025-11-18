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
 */

import React, { useEffect } from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';
import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function FeedPage() {
  const user = useUser();
  const userDistrict = useFormattedDistrict();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
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
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  return (
    <div className="container mx-auto px-4 py-8">
      <UnifiedFeedRefactored
        {...{
          enableAnalytics: true,
          maxItems: 50,
          userDistrict,
          ...(user?.id ? { userId: user.id } : {}),
        }}
      />
    </div>
  );
}
