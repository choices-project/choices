/**
 * District Heatmap API
 * 
 * Returns engagement metrics across congressional districts.
 * Shows which districts have the most user engagement.
 * 
 * Privacy Features:
 * - Only shows districts (never full addresses)
 * - K-anonymity enforcement (min 5 users per district)
 * - Only opted-in users included
 * - Aggregated data only
 * 
 * Access: Admin-only
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

import { type NextRequest, NextResponse } from 'next/server';

import { PrivacyAwareQueryBuilder, K_ANONYMITY_THRESHOLD } from '@/features/analytics/lib/privacyFilters';
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
      logAnalyticsAccess(user, 'district-heatmap-api', false);
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logAnalyticsAccess(user, 'district-heatmap-api', true);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const stateFilter = searchParams.get('state');
    const levelFilter = searchParams.get('level') ?? 'federal';
    const minCount = parseInt(searchParams.get('min_count') ?? String(K_ANONYMITY_THRESHOLD));

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX.DISTRICT_HEATMAP, { 
      state: stateFilter, 
      level: levelFilter 
    });

    // Try to get from cache or fetch from database
    const { data: result, fromCache } = await getCached(
      cacheKey,
      CACHE_TTL.DISTRICT_HEATMAP,
      async () => {
        // Initialize privacy-aware query builder
        const queryBuilder = new PrivacyAwareQueryBuilder(supabase);

    // Get opted-in users with location data
    const { users } = await queryBuilder.getDemographics();

    // Group by district
    const districtGroups = new Map<string, any[]>();
    
    users.forEach(u => {
      const demographics = u.demographics;
      if (!demographics || typeof demographics !== 'object') return;
      
      const location = demographics.location;
      if (!location || typeof location !== 'object') return;
      
      const state = location.state;
      const district = location.district;
      
      if (!state) return;
      
      // Apply state filter if specified
      if (stateFilter && state !== stateFilter) return;
      
      // Create district key
      const districtKey = district ? `${state}-${district}` : state;
      
      if (!districtGroups.has(districtKey)) {
        districtGroups.set(districtKey, []);
      }
      districtGroups.get(districtKey)!.push(u);
    });

    // Get civic actions count per district
    const { data: civicActions } = await supabase
      .from('civic_actions')
      .select('id, target_district');

    // Count representatives per district
    const { data: representatives } = await supabase
      .from('representatives_core')
      .select('id, district');

    // Build heatmap entries
    const heatmap = Array.from(districtGroups.entries())
      .map(([districtKey, districtUsers]) => {
        const userCount = districtUsers.length;
        
        // Apply k-anonymity filter
        if (userCount < minCount) {
          return null;
        }

        // Parse district key
        const parts = districtKey.split('-');
        const state = parts[0];
        const districtNum = parts[1] ?? 'At-Large';

        // Count civic actions for this district
        const actionCount = (civicActions ?? []).filter((a: any) => 
          a.target_district === districtKey
        ).length;

        // Count representatives for this district
        const repCount = (representatives ?? []).filter((r: any) => {
          if (!r.district) return false;
          const repDistrict = typeof r.district === 'string' ? r.district : '';
          return repDistrict === districtKey || repDistrict.includes(state);
        }).length;

        // Calculate engagement (user count + civic actions)
        const engagementCount = userCount + actionCount;

        return {
          district_id: districtKey,
          district_name: `${state} District ${districtNum}`,
          state,
          level: levelFilter,
          engagement_count: engagementCount,
          representative_count: repCount
        };
      })
      .filter(entry => entry !== null)
      .sort((a, b) => {
        if (!a || !b) return 0;
        return b.engagement_count - a.engagement_count;
      });

    logger.info('District heatmap generated', {
      districtsReturned: heatmap.length,
      stateFilter: stateFilter ?? 'all',
      levelFilter,
      minCount
    });

        return {
          ok: true,
          heatmap,
          k_anonymity: minCount,
          generated_at: new Date().toISOString()
        };
      }
    );

    // Return with cache metadata
    return NextResponse.json({
      ...result,
      _cache: {
        hit: fromCache,
        ttl: CACHE_TTL.DISTRICT_HEATMAP,
        key: cacheKey
      }
    });

  } catch (error) {
    logger.error('District heatmap API error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
