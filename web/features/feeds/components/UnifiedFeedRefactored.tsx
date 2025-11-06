'use client';

/**
 * UnifiedFeed - Refactored Architecture
 * 
 * Clean composition of focused components:
 * - FeedDataProvider: Handles store integration and data
 * - FeedCore: Pure presentational component
 * - Future: FeedPWAEnhancer, FeedRealTimeUpdates, etc.
 * 
 * This architecture prevents infinite loops by:
 * - Separating concerns
 * - Isolating side effects
 * - Using render props pattern
 * - Avoiding complex dependency chains
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-grade refactor
 */

import React from 'react';

import FeedCore from './core/FeedCore';
import FeedDataProvider from './providers/FeedDataProvider';

type UnifiedFeedProps = {
  userId?: string;
  userDistrict?: string | null;
  className?: string;
  enablePersonalization?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  enableHaptics?: boolean;
  enableHashtagPolls?: boolean;
  enableMobileOptimization?: boolean;
  showTrending?: boolean;
  maxItems?: number;
};

/**
 * Main UnifiedFeed component - now a simple composition
 * No complex state, no infinite loops
 * 
 * Enhanced: November 5, 2025 - Added district filtering support
 */
export default function UnifiedFeedRefactored({
  userId,
  userDistrict,
  className = '',
  enablePersonalization = true,
  enableRealTimeUpdates = true,
  enableAnalytics = false,
  enableHaptics = true,
  enableHashtagPolls = true,
  enableMobileOptimization = true,
  showTrending = true,
  maxItems = 50
}: UnifiedFeedProps) {
  console.log('[UnifiedFeedRefactored] Rendering', { userId, userDistrict });

  return (
    <FeedDataProvider userId={userId} userDistrict={userDistrict}>
      {(dataProps) => (
        <FeedCore
          {...dataProps}
          className={className}
          userDistrict={userDistrict}
        />
      )}
    </FeedDataProvider>
  );
}

