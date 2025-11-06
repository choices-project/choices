/**
 * Demographics Analytics API
 * 
 * Returns user demographic breakdowns with privacy protections.
 * 
 * Privacy Features:
 * - Only includes users who opted in (collectAnalytics = true)
 * - Applies k-anonymity (min 5 users per category)
 * - Returns opt-out count for transparency
 * - No individual user data exposed
 * - Access logged for audit trail
 * 
 * Access: Admin-only
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready with privacy-first design
 */

import { type NextRequest, NextResponse } from 'next/server';

import { 
  PrivacyAwareQueryBuilder,
  applyKAnonymity,
  K_ANONYMITY_THRESHOLD,
  privacyAwareAggregate
} from '@/features/analytics/lib/privacyFilters';
import { canAccessAnalytics, logAnalyticsAccess } from '@/lib/auth/adminGuard';
import { getCached, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Access control - Admin only
    if (!canAccessAnalytics(user, false)) {
      logAnalyticsAccess(user, 'demographics-api', false);
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logAnalyticsAccess(user, 'demographics-api', true);

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX.DEMOGRAPHICS);

    // Try to get from cache or fetch from database
    const { data: result, fromCache } = await getCached(
      cacheKey,
      CACHE_TTL.DEMOGRAPHICS,
      async () => {
        // Initialize privacy-aware query builder
        const queryBuilder = new PrivacyAwareQueryBuilder(supabase);

    // Get opted-in users with demographics
    const { users, totalUsers, optedInCount, optedOutCount } = 
      await queryBuilder.getDemographics();

    // Process Trust Tiers
    const trustTierCounts = new Map<string, number>();
    users.forEach(u => {
      const tier = u.trust_tier || 'T0';
      trustTierCounts.set(tier, (trustTierCounts.get(tier) || 0) + 1);
    });

    const trustTiers = Array.from(trustTierCounts.entries()).map(([tier, count]) => ({
      tier,
      count,
      percentage: parseFloat(((count / optedInCount) * 100).toFixed(1))
    }));

    // Apply k-anonymity
    const filteredTrustTiers = applyKAnonymity(trustTiers, K_ANONYMITY_THRESHOLD, 'count');

    // Process Age Groups
    const ageGroups = privacyAwareAggregate(
      users.map(u => ({ 
        age: extractAgeGroup(u.demographics) 
      })),
      'age',
      K_ANONYMITY_THRESHOLD
    );

    // Process Districts (top 10 only)
    const districts = privacyAwareAggregate(
      users.map(u => ({ 
        district: extractDistrict(u.demographics) 
      })),
      'district',
      K_ANONYMITY_THRESHOLD
    ).slice(0, 10);

    // Process Education
    const education = privacyAwareAggregate(
      users.map(u => ({ 
        education: extractEducation(u.demographics) 
      })),
      'education',
      K_ANONYMITY_THRESHOLD
    );

        // Return privacy-protected results
        return {
          ok: true,
          trustTiers: filteredTrustTiers.map(t => ({
            tier: t.tier,
            count: t.count,
            percentage: t.percentage
          })),
          ageGroups: ageGroups.map((a: any) => ({
            ageGroup: a.category,
            count: a.count,
            percentage: a.percentage
          })),
          districts: districts.map((d: any) => ({
            district: d.category,
            count: d.count,
            percentage: d.percentage
          })),
          education: education.map((e: any) => ({
            level: e.category,
            count: e.count,
            percentage: e.percentage
          })),
          totalUsers,
          privacyOptOuts: optedOutCount,
          k_anonymity: K_ANONYMITY_THRESHOLD
        };
      }
    );

    logger.info('Demographics data served', { fromCache });

    return NextResponse.json({
      ...result,
      _cache: {
        hit: fromCache,
        ttl: CACHE_TTL.DEMOGRAPHICS
      }
    });

  } catch (error) {
    logger.error('Demographics API error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions to extract demographic data safely
 */
function extractAgeGroup(demographics: any): string {
  if (!demographics || typeof demographics !== 'object') return 'Unknown';
  
  const age = demographics.age;
  if (typeof age !== 'number') return 'Unknown';
  
  if (age < 18) return 'Under 18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
}

function extractDistrict(demographics: any): string {
  if (!demographics || typeof demographics !== 'object') return 'Unknown';
  
  const location = demographics.location;
  if (!location || typeof location !== 'object') return 'Unknown';
  
  const state = location.state;
  const district = location.district;
  
  if (!state) return 'Unknown';
  if (!district) return state; // State-only
  
  return `${state}-${district}`;
}

function extractEducation(demographics: any): string {
  if (!demographics || typeof demographics !== 'object') return 'Unknown';
  
  const education = demographics.education;
  if (!education || typeof education !== 'string') return 'Unknown';
  
  return education;
}

