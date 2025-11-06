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

import { logger } from '@/lib/utils/logger';

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
  enablePersonalization: _enablePersonalization = true,
  enableRealTimeUpdates: _enableRealTimeUpdates = true,
  enableAnalytics: _enableAnalytics = false,
  enableHaptics: _enableHaptics = true,
  enableHashtagPolls: _enableHashtagPolls = true,
  enableMobileOptimization: _enableMobileOptimization = true,
  showTrending: _showTrending = true,
  maxItems = 50
}: UnifiedFeedProps) {
  logger.debug('[UnifiedFeedRefactored] Rendering', { userId, userDistrict });

  return (
    <FeedDataProvider 
      {...(userId ? { userId } : {})}
      {...(userDistrict !== undefined ? { userDistrict } : {})}
    >
      {(dataProps) => (
        <FeedCore
          {...dataProps}
          className={className}
          userDistrict={userDistrict ?? null}
        />
      )}
    </FeedDataProvider>
  );
}

