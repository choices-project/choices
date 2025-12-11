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

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import type { FeedHashtagAnalytics } from '@/features/hashtags/types';

import { logger } from '@/lib/utils/logger';

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

let clientInstance: HashtagPollsIntegrationServiceClient | null = null;

export function getHashtagPollsIntegrationServiceClient(): HashtagPollsIntegrationServiceClient {
  if (typeof window === 'undefined') {
    throw new Error(
      'HashtagPollsIntegrationServiceClient can only be used in the browser. Import the server version for server-side usage.'
    );
  }

  if (!clientInstance) {
    clientInstance = new HashtagPollsIntegrationServiceClient();
  }

  return clientInstance;
}
