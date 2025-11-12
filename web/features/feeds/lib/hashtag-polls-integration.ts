/**
 * Hashtag-Polls Integration for Feeds - Server Version
 * 
 * Server-side implementation of hashtag-polls integration service
 * Uses server-side Supabase client for enhanced security
 * 
 * Created: January 19, 2025
 * Last Updated: November 5, 2025
 * Status: ✅ REFACTORED - Eliminates duplication via base class
 */

import type { FeedHashtagAnalytics } from '@/features/hashtags/types';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  BaseHashtagPollsIntegrationService,
  type PollRecommendation,
  type HashtagPollIntegration,
  type PersonalizedHashtagFeed,
} from './hashtag-polls-integration-base';

// Re-export types for convenience
export type {
  PollRecommendation,
  HashtagPollIntegration,
  FeedHashtagAnalytics,
  PersonalizedHashtagFeed,
};

/**
 * Server-Side Hashtag-Polls Integration Service
 * 
 * Extends base class with server-specific Supabase initialization
 * Provides enhanced security and server-only database access
 */
export class HashtagPollsIntegrationService extends BaseHashtagPollsIntegrationService {
  /**
   * Initialize Supabase server client
   */
  protected async initializeSupabase(): Promise<void> {
    try {
      this.supabase = await getSupabaseServerClient();
    } catch (error) {
      logger.error('Failed to initialize Supabase server client:', error as Error);
      this.supabase = null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const hashtagPollsIntegrationService = new HashtagPollsIntegrationService();
