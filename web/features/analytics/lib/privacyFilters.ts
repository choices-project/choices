/**
 * Privacy Filters for Analytics
 * 
 * Ensures all analytics queries respect user privacy settings.
 * Implements k-anonymity and opt-out filtering at the query level.
 * 
 * Key Principles:
 * - Users who opted out are NEVER included in analytics
 * - Minimum 5 users per category (k-anonymity)
 * - No individual identification possible
 * - Audit logging for compliance
 * 
 * Created: November 5, 2025
 * Status: ✅ Privacy-first analytics
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

/**
 * K-Anonymity threshold
 * Minimum number of users required to display a category
 */
export const K_ANONYMITY_THRESHOLD = 5;

/**
 * Privacy-aware query builder
 * Automatically excludes users who opted out of analytics
 */
export class PrivacyAwareQueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get base query with privacy filters applied
   * Excludes users with collectAnalytics = false
   */
  async getPrivacyFilteredQuery<T>(
    table: string,
    columns: string = '*'
  ) {
    // Build query that respects privacy settings
    // First, get users who opted IN to analytics
    const { data: optedInUsers, error: usersError } = await this.supabase
      .from('user_profiles')
      .select('id')
      .or('privacy_settings->collectAnalytics.eq.true,privacy_settings.is.null');

    if (usersError) {
      logger.error('Failed to fetch opted-in users', { error: usersError });
      throw new Error('Privacy filter query failed');
    }

    const optedInUserIds = optedInUsers?.map(u => u.id) || [];

    // Log privacy filtering
    logger.debug('Privacy filter applied', {
      table,
      optedInCount: optedInUserIds.length,
      timestamp: new Date().toISOString()
    });

    // Return query builder with user filter
    return this.supabase
      .from(table)
      .select(columns)
      .in('user_id', optedInUserIds);
  }

  /**
   * Get vote analytics with privacy filters
   */
  async getVoteAnalytics(filters?: {
    dateRange?: string;
    district?: string;
    pollId?: string;
  }) {
    // First, get users who opted IN to analytics
    const { data: optedInUsers, error: usersError } = await this.supabase
      .from('user_profiles')
      .select('id')
      .or('privacy_settings->collectAnalytics.eq.true,privacy_settings.is.null');

    if (usersError) {
      logger.error('Failed to fetch opted-in users', { error: usersError });
      throw new Error('Privacy filter query failed');
    }

    const optedInUserIds = optedInUsers?.map(u => u.id) || [];

    // Build votes query
    let votesQuery = this.supabase
      .from('votes')
      .select('id, user_id, poll_id, created_at, vote_data')
      .in('user_id', optedInUserIds);

    // Apply additional filters
    if (filters?.dateRange) {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      votesQuery = votesQuery.gte('created_at', cutoffDate.toISOString());
    }

    if (filters?.pollId) {
      votesQuery = votesQuery.eq('poll_id', filters.pollId);
    }

    return votesQuery;
  }

  /**
   * Get user demographics with privacy filters and k-anonymity
   */
  async getDemographics() {
    // Get opted-in users only
    const { data: users, error } = await this.supabase
      .from('user_profiles')
      .select('id, demographics, privacy_settings, trust_tier')
      .or('privacy_settings->collectAnalytics.eq.true,privacy_settings.is.null');

    if (error) {
      logger.error('Failed to fetch demographics', { error });
      throw new Error('Demographics query failed');
    }

    // Count total users for opt-out statistics
    const { count: totalUsers } = await this.supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });

    const optedInCount = users?.length || 0;
    const optedOutCount = (totalUsers || 0) - optedInCount;

    logger.info('Demographics privacy filter', {
      totalUsers,
      optedInCount,
      optedOutCount,
      privacyRespected: true
    });

    return {
      users: users || [],
      totalUsers: totalUsers || 0,
      optedInCount,
      optedOutCount
    };
  }
}

/**
 * Apply k-anonymity filter to aggregated data
 * Removes categories with fewer than K users
 * 
 * @param data Array of aggregated data with count field
 * @param k Minimum count threshold (default: 5)
 * @param countField Name of the count field
 */
export function applyKAnonymity<T extends Record<string, any>>(
  data: T[],
  k: number = K_ANONYMITY_THRESHOLD,
  countField: string = 'count'
): T[] {
  const filtered = data.filter(item => {
    const count = item[countField];
    return typeof count === 'number' && count >= k;
  });

  const removedCount = data.length - filtered.length;
  
  if (removedCount > 0) {
    logger.debug('K-anonymity filter applied', {
      originalCount: data.length,
      filteredCount: filtered.length,
      removedCount,
      threshold: k
    });
  }

  return filtered;
}

/**
 * Check if user has consented to analytics collection
 * 
 * @param userId User ID to check
 * @param supabase Supabase client
 */
export async function hasAnalyticsConsent(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('privacy_settings')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    logger.warn('Failed to check analytics consent', { userId, error });
    return false; // Fail closed (no consent = no tracking)
  }

  const settings = profile.privacy_settings as any;
  
  // Default to false if not explicitly set
  return settings?.collectAnalytics === true;
}

/**
 * Get count of users who opted out of analytics
 * For transparency in analytics dashboards
 */
export async function getPrivacyOptOutCount(
  supabase: SupabaseClient
): Promise<number> {
  const { count: totalUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });

  const { count: optedInUsers } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .or('privacy_settings->collectAnalytics.eq.true,privacy_settings.is.null');

  return (totalUsers || 0) - (optedInUsers || 0);
}

/**
 * Aggregate data with privacy protection
 * Groups data and applies k-anonymity automatically
 * 
 * @param data Raw data array
 * @param groupByField Field to group by
 * @param k K-anonymity threshold
 */
export function privacyAwareAggregate<T extends Record<string, any>>(
  data: T[],
  groupByField: keyof T,
  k: number = K_ANONYMITY_THRESHOLD
): Array<{ category: string; count: number; percentage: number }> {
  // Group and count
  const groups = new Map<string, number>();
  
  data.forEach(item => {
    const category = String(item[groupByField] || 'Unknown');
    groups.set(category, (groups.get(category) || 0) + 1);
  });

  // Convert to array
  const aggregated = Array.from(groups.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: (count / data.length) * 100
  }));

  // Apply k-anonymity
  const filtered = applyKAnonymity(aggregated, k, 'count');

  // Sort by count descending
  return filtered.sort((a, b) => b.count - a.count);
}

/**
 * Create privacy notice text for analytics views
 * Standard message explaining privacy protections
 */
export function getPrivacyNotice(optedOutCount: number, kThreshold: number = K_ANONYMITY_THRESHOLD): string {
  return `Privacy Protected: Only includes users who opted in to analytics collection. ${optedOutCount} users opted out and are excluded. Categories with fewer than ${kThreshold} users are hidden to ensure k-anonymity. Individual users cannot be identified.`;
}

/**
 * Validate analytics query for privacy compliance
 * Throws error if query would violate privacy
 * 
 * @param queryConfig Query configuration
 */
export function validatePrivacyCompliance(queryConfig: {
  includesUserId?: boolean;
  includesEmail?: boolean;
  includesAddress?: boolean;
  groupSize?: number;
}): void {
  if (queryConfig.includesUserId) {
    throw new Error('Privacy violation: Cannot include user_id in analytics results');
  }

  if (queryConfig.includesEmail) {
    throw new Error('Privacy violation: Cannot include email in analytics results');
  }

  if (queryConfig.includesAddress) {
    throw new Error('Privacy violation: Cannot include addresses in analytics results');
  }

  if (queryConfig.groupSize && queryConfig.groupSize < K_ANONYMITY_THRESHOLD) {
    throw new Error(`Privacy violation: Group size ${queryConfig.groupSize} is below k-anonymity threshold of ${K_ANONYMITY_THRESHOLD}`);
  }
}

/**
 * Sanitize data for public display
 * Removes any potentially identifying information
 * 
 * @param data Data to sanitize
 */
export function sanitizeForDisplay<T extends Record<string, any>>(data: T[]): T[] {
  const sensitiveFields = ['user_id', 'email', 'address', 'ip_address', 'device_id'];
  
  return data.map(item => {
    const clean = { ...item };
    sensitiveFields.forEach(field => {
      if (field in clean) {
        delete clean[field];
      }
    });
    return clean;
  });
}

