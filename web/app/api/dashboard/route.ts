/**
 * Optimized Dashboard API
 * 
 * High-performance consolidated dashboard endpoint that:
 * - Combines all dashboard data in a single request
 * - Implements intelligent caching
 * - Uses database query optimization
 * - Provides progressive loading support
 * 
 * Target: <3 second load time (currently 12+ seconds)
 * 
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../utils/supabase/server';
import cache, { CacheKeys, CacheTTL } from '../../../lib/cache/redis-cache';
import queryOptimizer from '../../../lib/database/query-optimizer';

export const dynamic = 'force-dynamic';

interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  analytics: {
    total_votes: number;
    total_polls_created: number;
    active_polls: number;
    total_votes_on_user_polls: number;
    participation_score: number;
    recent_activity: {
      votes_last_30_days: number;
      polls_created_last_30_days: number;
    };
  };
  preferences: {
    showElectedOfficials: boolean;
    showQuickActions: boolean;
    showRecentActivity: boolean;
    showEngagementScore: boolean;
  };
  electedOfficials?: Array<{
    id: string;
    name: string;
    title: string;
    party: string;
    district: string;
    photo_url?: string;
  }>;
  platformStats?: {
    total_users: number;
    total_polls: number;
    total_votes: number;
    active_polls: number;
  };
  generatedAt: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include') || 'all';
    const includeArray = include.split(',').map(item => item.trim());
    const useCache = searchParams.get('cache') !== 'false';

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const cacheKey = CacheKeys.DASHBOARD_DATA(userId);

    // Check cache first with extended TTL for better performance
    if (useCache) {
      const cachedData = await cache.get<DashboardData>(cacheKey);
      if (cachedData) {
        const loadTime = Date.now() - startTime;
        console.log(`⚡ Dashboard loaded from cache in ${loadTime}ms`);
        return NextResponse.json({
          ...cachedData,
          fromCache: true,
          loadTime,
          cacheHit: true
        });
      }
    }

    console.log('🚀 Loading dashboard data from database...');

    // Load all data in parallel for maximum performance
    console.log('🚀 Loading dashboard data for user:', userId);
    const [
      analytics,
      preferences,
      electedOfficials,
      platformStats
    ] = await Promise.all([
      loadUserAnalytics(supabase, userId),
      loadUserPreferences(supabase, userId),
      includeArray.includes('officials') ? loadElectedOfficials(supabase, userId) : Promise.resolve([]),
      includeArray.includes('platform') ? loadPlatformStats(supabase) : Promise.resolve(null)
    ]);
    
    console.log('📊 Dashboard data loaded:', {
      analytics: analytics ? 'loaded' : 'empty',
      preferences: preferences ? 'loaded' : 'empty', 
      electedOfficials: electedOfficials ? `loaded (${electedOfficials.length})` : 'empty',
      platformStats: platformStats ? 'loaded' : 'empty'
    });
    
    console.log('🔍 Detailed values:', {
      analytics: analytics,
      preferences: preferences,
      electedOfficials: electedOfficials,
      platformStats: platformStats
    });

    const dashboardData: DashboardData = {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || 'User'
      },
      analytics,
      preferences,
      electedOfficials: electedOfficials || [],
      platformStats: {
        total_polls: 0,
        total_votes: 0,
        active_polls: 0,
        total_users: 0
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    if (useCache) {
      await cache.set(cacheKey, dashboardData, CacheTTL.USER_DATA);
    }

    const loadTime = Date.now() - startTime;
    console.log(`⚡ Dashboard loaded in ${loadTime}ms`);

    return NextResponse.json({
      ...dashboardData,
      fromCache: false,
      loadTime
    });

  } catch (error) {
    console.error('Optimized dashboard API error:', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Load user analytics with optimized queries
 */
async function loadUserAnalytics(supabase: any, userId: string): Promise<DashboardData['analytics']> {
  console.log('🚀 loadUserAnalytics called with userId:', userId);
  const cacheKey = CacheKeys.USER_ANALYTICS(userId);
  
  // Check cache first for user analytics
  const cached = await cache.get<DashboardData['analytics']>(cacheKey);
  if (cached) {
    console.log('⚡ User analytics loaded from cache');
    return cached;
  }

  try {
    console.log('🔍 Loading user analytics from database for user:', userId);
    
    // Get user's vote count
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Optimized parallel queries for better performance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const [
      { count: totalPollsCreated },
      { count: activePolls },
      { data: userPolls },
      { count: votesLast30Days },
      { count: pollsCreatedLast30Days }
    ] = await Promise.all([
      supabase.from('polls').select('*', { count: 'exact', head: true }).eq('created_by', userId),
      supabase.from('polls').select('*', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'active'),
      supabase.from('polls').select('id').eq('created_by', userId),
      supabase.from('votes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', thirtyDaysAgo),
      supabase.from('polls').select('*', { count: 'exact', head: true }).eq('created_by', userId).gte('created_at', thirtyDaysAgo)
    ]);

    // Get votes on user's polls (only if user has polls)
    let totalVotesOnUserPolls = 0;
    if (userPolls && userPolls.length > 0) {
      const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .in('poll_id', userPolls.map((p: any) => p.id));
      totalVotesOnUserPolls = count || 0;
    }

    // Calculate participation score (0-100)
    const participationScore = Math.min(100, Math.max(0, 
      ((totalVotes || 0) * 10) + ((totalPollsCreated || 0) * 20)
    ));

    const processedData = {
      total_votes: totalVotes || 0,
      total_polls_created: totalPollsCreated || 0,
      active_polls: activePolls || 0,
      total_votes_on_user_polls: totalVotesOnUserPolls,
      participation_score: participationScore,
      recent_activity: {
        votes_last_30_days: votesLast30Days || 0,
        polls_created_last_30_days: pollsCreatedLast30Days || 0
      }
    };

    console.log('✅ Analytics data loaded:', processedData);

    // Cache the result
    await cache.set(cacheKey, processedData, CacheTTL.USER_DATA);
    
    return processedData;

  } catch (error) {
    console.error('Error loading user analytics:', error as Error);
    return {
      total_votes: 0,
      total_polls_created: 0,
      active_polls: 0,
      total_votes_on_user_polls: 0,
      participation_score: 0,
      recent_activity: {
        votes_last_30_days: 0,
        polls_created_last_30_days: 0
      }
    };
  }
}

/**
 * Load user preferences
 */
async function loadUserPreferences(supabase: any, userId: string): Promise<DashboardData['preferences']> {
  console.log('🚀 loadUserPreferences called with userId:', userId);
  const cacheKey = CacheKeys.USER_PREFERENCES(userId);
  
  // Check cache first for user preferences
  const cached = await cache.get<DashboardData['preferences']>(cacheKey);
  if (cached) {
    console.log('⚡ User preferences loaded from cache');
    return cached;
  }

  try {
    console.log('🔍 Loading user preferences directly for user:', userId);
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('No preferences found, using defaults');
      const defaultResult = {
        showElectedOfficials: false,
        showQuickActions: true,
        showRecentActivity: true,
        showEngagementScore: true
      };
      
      // Cache the default result
      await cache.set(cacheKey, defaultResult, CacheTTL.USER_DATA);
      return defaultResult;
    }

    const preferences = (profile as any)?.preferences || {};
    const result = {
      showElectedOfficials: preferences.showElectedOfficials || false,
      showQuickActions: preferences.showQuickActions !== false,
      showRecentActivity: preferences.showRecentActivity !== false,
      showEngagementScore: preferences.showEngagementScore !== false
    };

    console.log('✅ Preferences data loaded:', result);

    // Cache the result
    await cache.set(cacheKey, result, CacheTTL.USER_DATA);
    return result;

  } catch (error) {
    console.error('Error loading user preferences:', error as Error);
    return {
      showElectedOfficials: false,
      showQuickActions: true,
      showRecentActivity: true,
      showEngagementScore: true
    };
  }
}

/**
 * Load elected officials (cached for 1 hour)
 */
async function loadElectedOfficials(supabase: any, userId: string): Promise<DashboardData['electedOfficials']> {
  const cacheKey = CacheKeys.ELECTED_OFFICIALS(userId);
  
  // TEMPORARY: Disable caching until cache implementation is fixed
  // const cached = await cache.get(cacheKey);
  // if (cached && Array.isArray(cached)) {
  //   return cached;
  // }

  try {
    // Mock data for now - would integrate with civics API
    const mockOfficials = [
      {
        id: '1',
        name: 'John Smith',
        title: 'U.S. Representative',
        party: 'Democrat',
        district: 'CA-12',
        photo_url: '/api/placeholder/64/64'
      },
      {
        id: '2',
        name: 'Jane Doe',
        title: 'State Senator',
        party: 'Republican',
        district: 'District 3',
        photo_url: '/api/placeholder/64/64'
      }
    ];

    // Cache the result for 1 hour
    await cache.set(cacheKey, mockOfficials, CacheTTL.ELECTED_OFFICIALS);
    return mockOfficials;

  } catch (error) {
    console.error('Error loading elected officials:', error as Error);
    return [];
  }
}

/**
 * Load platform statistics
 */
async function loadPlatformStats(supabase: any) {
  const cacheKey = CacheKeys.PLATFORM_STATS();
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Optimized queries for platform stats
    const [usersResult, pollsResult, votesResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('polls').select('id', { count: 'exact', head: true }),
      supabase.from('votes').select('id', { count: 'exact', head: true })
    ]);

    const result = {
      total_users: usersResult.count || 0,
      total_polls: pollsResult.count || 0,
      total_votes: votesResult.count || 0,
      active_polls: 0 // Would need separate query for active polls
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, result, CacheTTL.PLATFORM_STATS);
    return result;

  } catch (error) {
    console.error('Error loading platform stats:', error as Error);
    return null;
  }
}
