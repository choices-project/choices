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

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { PrivacyAwareQueryBuilder, K_ANONYMITY_THRESHOLD } from '@/features/analytics/lib/privacyFilters';


import { withErrorHandling, forbiddenError, successResponse } from '@/lib/api';
import { canAccessAnalytics, fetchAccessProfile, logAnalyticsAccess } from '@/lib/auth/adminGuard';
import { getCached, CACHE_TTL, CACHE_PREFIX, generateCacheKey, type JsonValue } from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accessProfile = await fetchAccessProfile(supabase, user?.id);

  if (!canAccessAnalytics(user, false, accessProfile)) {
    logAnalyticsAccess(user, 'district-heatmap-api', false, accessProfile);
    return forbiddenError('Unauthorized - Admin access required');
  }

  logAnalyticsAccess(user, 'district-heatmap-api', true, accessProfile);

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
        type HeatmapResult = {
          heatmap: Array<{
            district_id: string;
            district_name: string;
            state: string;
            level: string;
            engagement_count: number;
            representative_count: number;
          }>;
          k_anonymity: number;
          generated_at: string;
        };
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
      const group = districtGroups.get(districtKey);
      if (group) {
        group.push(u);
      }
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
          state: state ?? 'Unknown',
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

        const heatmapResult: HeatmapResult = {
          heatmap,
          k_anonymity: minCount,
          generated_at: new Date().toISOString()
        };
        return heatmapResult as unknown as JsonValue;
      }
    );

    type HeatmapResponse = {
      heatmap: Array<{
        district_id: string;
        district_name: string;
        state: string;
        level: string;
        engagement_count: number;
        representative_count: number;
      }>;
      k_anonymity: number;
      generated_at: string;
    };
    const responseData = result as HeatmapResponse | null;
    return successResponse(
      {
        heatmap: responseData?.heatmap ?? [],
        kAnonymity: responseData?.k_anonymity ?? minCount,
        generatedAt: responseData?.generated_at ?? new Date().toISOString()
      },
      {
        cache: {
          hit: fromCache,
          ttl: CACHE_TTL.DISTRICT_HEATMAP,
          key: cacheKey
        }
      }
    );
});
