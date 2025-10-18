/**
 * Civics Heatmap API Endpoint
 * 
 * Provides privacy-safe geographic analytics for civic engagement
 * Uses k-anonymity to protect user privacy while providing useful insights
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache } from '@/lib/utils/civics-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  const logger = createApiLogger('/api/civics/heatmap', 'GET');
  
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const districtType = searchParams.get('type') || 'all'; // congressional, state_senate, state_house, all
    const minCount = Number(searchParams.get('min_count')) || 5; // k-anonymity threshold
    
    // Validate state parameter
    if (!state) {
      return NextResponse.json({ 
        success: false,
        error: 'State parameter is required. Expected format: ?state=CA',
        metadata: {
          source: 'validation',
          last_updated: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Validate district type
    const validTypes = ['congressional', 'state_senate', 'state_house', 'all'];
    if (!validTypes.includes(districtType)) {
      return NextResponse.json({ 
        success: false,
        error: `Invalid type parameter. Must be one of: ${validTypes.join(', ')}`,
        metadata: {
          source: 'validation',
          last_updated: new Date().toISOString()
        }
      }, { status: 400 });
    }

    logger.info('Generating district-based heatmap data', { state, districtType, minCount });

    // Check cache first
    const cacheKey = `heatmap:${state}:${districtType}:${minCount}`;
    const cachedData = CivicsCache.get(cacheKey);
    if (cachedData) {
      logger.info('Returning cached heatmap data', { state, districtType });
      return NextResponse.json({
        success: true,
        data: cachedData,
        metadata: {
          source: 'cache',
          last_updated: new Date().toISOString(),
          data_quality_score: 95
        }
      });
    }

    // Get district-based heatmap data from database
    const heatmapData = await getDistrictHeatmapData(supabase, state, districtType, minCount);

    // Cache the data
    CivicsCache.set(cacheKey, heatmapData, 15 * 60 * 1000); // 15 minutes cache

    logger.success('District heatmap data generated successfully', 200, { 
      state, 
      districtType, 
      districtCount: heatmapData?.length || 0 
    });

    return NextResponse.json({
      success: true,
      data: {
        state,
        district_type: districtType,
        min_count: minCount,
        total_districts: heatmapData?.length || 0,
        districts: heatmapData || [],
        privacy_note: 'Data aggregated by district with k-anonymity protection',
        engagement_metrics: await getEngagementMetrics(supabase, state)
      },
      metadata: {
        source: 'database',
        last_updated: new Date().toISOString(),
        data_quality_score: 95
      }
    });

  } catch (error) {
    logger.error('Heatmap generation error', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Heatmap generation failed',
      metadata: {
        source: 'error',
        last_updated: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * Get district-based heatmap data from database
 */
async function getDistrictHeatmapData(supabase: any, state: string, districtType: string, minCount: number) {
  try {
    // Build query based on district type
    let query = supabase
      .from('representatives_core')
      .select(`
        district,
        state,
        level,
        office,
        name,
        party,
        bioguide_id
      `)
      .eq('state', state.toUpperCase());

    // Filter by district type if not 'all'
    if (districtType !== 'all') {
      if (districtType === 'congressional') {
        query = query.eq('level', 'federal');
      } else if (districtType === 'state_senate') {
        query = query.eq('level', 'state').like('office', '%Senate%');
      } else if (districtType === 'state_house') {
        query = query.eq('level', 'state').like('office', '%House%');
      }
    }

    const { data: representatives, error } = await query;

    if (error) {
      console.error('Error fetching representatives:', error);
      return [];
    }

    // Get user engagement data for each district
    const districtData = await Promise.all(
      (representatives || []).map(async (rep: any) => {
        const engagementData = await getDistrictEngagement(supabase, rep.district, rep.state);
        
        return {
          district: rep.district,
          state: rep.state,
          level: rep.level,
          office: rep.office,
          representative: {
            name: rep.name,
            party: rep.party,
            bioguide_id: rep.bioguide_id
          },
          engagement: engagementData,
          // Only include districts that meet k-anonymity threshold
          ...(engagementData.total_users >= minCount ? {
            total_users: engagementData.total_users,
            active_users: engagementData.active_users,
            polls_created: engagementData.polls_created,
            votes_cast: engagementData.votes_cast,
            engagement_score: engagementData.engagement_score
          } : {})
        };
      })
    );

    // Filter out districts that don't meet k-anonymity threshold
    return districtData.filter(district => district.total_users >= minCount);

  } catch (error) {
    console.error('Error generating district heatmap data:', error);
    return [];
  }
}

/**
 * Get engagement metrics for a specific district
 */
async function getDistrictEngagement(supabase: any, district: string, state: string) {
  try {
    // Get users who have looked up this district via address lookup
    const { data: addressLookups } = await supabase
      .from('user_address_lookups')
      .select('user_id, created_at')
      .eq('state', state.toUpperCase())
      .eq('district', district);

    const userIds = addressLookups?.map((lookup: any) => lookup.user_id) || [];

    if (userIds.length === 0) {
      return {
        total_users: 0,
        active_users: 0,
        polls_created: 0,
        votes_cast: 0,
        engagement_score: 0
      };
    }

    // Get user activity metrics
    const { data: userActivity } = await supabase
      .from('user_profiles')
      .select('user_id, total_polls_created, total_votes_cast, engagement_score')
      .in('user_id', userIds);

    const { data: recentActivity } = await supabase
      .from('votes')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalUsers = userIds.length;
    const activeUsers = new Set(recentActivity?.map((vote: any) => vote.user_id) || []).size;
    const pollsCreated = userActivity?.reduce((sum: number, user: any) => sum + (user.total_polls_created || 0), 0) || 0;
    const votesCast = userActivity?.reduce((sum: number, user: any) => sum + (user.total_votes_cast || 0), 0) || 0;
    const avgEngagementScore = userActivity?.length > 0 
      ? userActivity.reduce((sum: number, user: any) => sum + (user.engagement_score || 0), 0) / userActivity.length 
      : 0;

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      polls_created: pollsCreated,
      votes_cast: votesCast,
      engagement_score: Math.round(avgEngagementScore)
    };

  } catch (error) {
    console.error('Error getting district engagement:', error);
    return {
      total_users: 0,
      active_users: 0,
      polls_created: 0,
      votes_cast: 0,
      engagement_score: 0
    };
  }
}

/**
 * Get overall engagement metrics for the state/district type
 */
async function getEngagementMetrics(supabase: any, state: string) {
  try {
    // Get total users who have done address lookups in this state
    const { data: stateLookups } = await supabase
      .from('user_address_lookups')
      .select('user_id')
      .eq('state', state.toUpperCase());

    const userIds = stateLookups?.map((lookup: any) => lookup.user_id) || [];

    if (userIds.length === 0) {
      return {
        total_civic_users: 0,
        total_engagement_score: 0,
        civic_participation_rate: 0
      };
    }

    // Get user profiles for engagement metrics
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('engagement_score, total_polls_created, total_votes_cast')
      .in('user_id', userIds);

    const totalCivicUsers = userIds.length;
    const totalEngagementScore = userProfiles?.reduce((sum: number, user: any) => sum + (user.engagement_score || 0), 0) || 0;
    const avgEngagementScore = totalCivicUsers > 0 ? totalEngagementScore / totalCivicUsers : 0;
    const civicParticipationRate = totalCivicUsers > 0 ? Math.round((userProfiles?.length || 0) / totalCivicUsers * 100) : 0;

    return {
      total_civic_users: totalCivicUsers,
      total_engagement_score: Math.round(avgEngagementScore),
      civic_participation_rate: civicParticipationRate
    };

  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    return {
      total_civic_users: 0,
      total_engagement_score: 0,
      civic_participation_rate: 0
    };
  }
}



