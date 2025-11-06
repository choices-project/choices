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

import React from 'react';

import { UnifiedFeedRefactored } from '@/features/feeds';
import { useFormattedDistrict } from '@/features/profile/hooks/useUserDistrict';
import { useUserStore } from '@/lib/stores';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function FeedPage() {
  const user = useUserStore(state => state.user);
  const userDistrict = useFormattedDistrict();

  return (
    <div className="container mx-auto px-4 py-8">
      <UnifiedFeedRefactored
        userId={user?.id}
        userDistrict={userDistrict}
        enableAnalytics
        maxItems={50}
      />
    </div>
  );
}
