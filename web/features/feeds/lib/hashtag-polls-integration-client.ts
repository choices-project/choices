/**
 * Hashtag-Polls Integration for Feeds - Client Version
 * 
 * Client-safe implementation of hashtag-polls integration service
 * Uses client-side Supabase client for browser compatibility
 * 
 * Created: January 19, 2025
 * Last Updated: November 5, 2025
 * Status: ✅ REFACTORED - Eliminates duplication via base class
 */

import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import {
  BaseHashtagPollsIntegrationService,
  type PollRecommendation,
  type HashtagPollIntegration,
  type PersonalizedHashtagFeed,
} from './hashtag-polls-integration-base';
import type { FeedHashtagAnalytics } from '@/features/hashtags/types';

// Re-export types for convenience
export type {
  PollRecommendation,
  HashtagPollIntegration,
  FeedHashtagAnalytics,
  PersonalizedHashtagFeed,
};

/**
 * Client-Safe Hashtag-Polls Integration Service
 * 
 * Extends base class with client-specific Supabase initialization
 * Safe for use in browser environments
 */
export class HashtagPollsIntegrationServiceClient extends BaseHashtagPollsIntegrationService {
  /**
   * Initialize Supabase browser client
   */
  protected async initializeSupabase(): Promise<void> {
    try {
      this.supabase = await getSupabaseBrowserClient();
    } catch (error) {
      logger.error('Failed to initialize Supabase browser client:', error instanceof Error ? error : new Error(String(error)));
      this.supabase = null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const hashtagPollsIntegrationServiceClient = new HashtagPollsIntegrationServiceClient();
