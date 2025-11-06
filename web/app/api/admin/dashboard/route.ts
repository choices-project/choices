import type { NextRequest } from 'next/server';

import { getRedisClient } from '@/lib/cache/redis-client';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type AdminDashboardData = {
  admin_user: {
    id: string;
    email: string;
    name: string;
  };
  overview: {
    total_users: number;
    total_polls: number;
    total_votes: number;
    active_polls: number;
    new_users_last_7_days: number;
    engagement_rate: number;
  };
  analytics: {
    user_growth: Array<{
      date: string;
      new_users: number;
      total_users: number;
    }>;
    poll_activity: Array<{
      date: string;
      polls_created: number;
      votes_cast: number;
    }>;
    top_categories: Array<{
      category: string;
      poll_count: number;
      vote_count: number;
    }>;
  };
  system_health: {
    status: string;
    database_latency_ms: number;
    uptime_percentage: number;
    last_health_check: string;
  };
  recent_activity: {
    new_users: Array<{
      id: string;
      email: string;
      created_at: string;
    }>;
    recent_polls: Array<{
      id: string;
      title: string;
      created_by: string;
      created_at: string;
      total_votes: number;
    }>;
    recent_votes: Array<{
      id: string;
      poll_id: string;
      user_id: string;
      created_at: string;
    }>;
  };
  generatedAt: string;
}

/**
 * Get admin dashboard data
 *
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.include] - Data sections to include (default: 'all')
 * @param {boolean} [request.searchParams.cache] - Whether to use cache (default: true)
 * @returns {Promise<NextResponse>} Admin dashboard data
 *
 * @example
 * GET /api/admin/dashboard
 * GET /api/admin/dashboard?include=overview,analytics&cache=false
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include') ?? 'all';
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

    // Check if user is admin by querying the user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.is_admin ?? false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const _adminId = user.id;
    const cache = await getRedisClient();
    const cacheKey = 'admin:dashboard';
    const cacheTTLSeconds = 60 * 5;

    // Check cache first
    if (useCache) {
      const cachedData = await cache.get<AdminDashboardData>(cacheKey);
      if (cachedData) {
        const loadTime = Date.now() - startTime;
        logger.info('Admin dashboard loaded from cache', { loadTime });
        return NextResponse.json({
          ...cachedData,
          fromCache: true,
          loadTime
        });
      }
    }

    logger.debug('Loading admin dashboard data from database');

    // Load all data in parallel for maximum performance
    const [
      overview,
      analytics,
      systemHealth,
      recentActivity
    ] = await Promise.all([
      loadAdminOverview(supabase),
      includeArray.includes('analytics') ? loadAdminAnalytics(supabase) : Promise.resolve(null),
      includeArray.includes('health') ? loadSystemHealth(supabase) : Promise.resolve(null),
      includeArray.includes('activity') ? loadRecentActivity(supabase) : Promise.resolve(null)
    ]);

    const dashboardData: AdminDashboardData = {
      admin_user: {
        id: user.id,
        email: user.email ?? '',
        name: user.email?.split('@')[0] ?? 'Admin'
      },
      overview,
      analytics: {
        user_growth: (analytics as any)?.user_growth ?? [],
        poll_activity: (analytics as any)?.poll_activity ?? [],
        top_categories: (analytics as any)?.top_categories ?? []
      },
      system_health: {
        status: (systemHealth as any)?.status ?? 'unknown',
        database_latency_ms: (systemHealth as any)?.database_latency_ms ?? 0,
        uptime_percentage: (systemHealth as any)?.uptime_percentage ?? 0,
        last_health_check: (systemHealth as any)?.last_health_check ?? new Date().toISOString()
      },
      recent_activity: {
        new_users: (recentActivity as any)?.new_users ?? [],
        recent_polls: (recentActivity as any)?.recent_polls ?? [],
        recent_votes: (recentActivity as any)?.recent_votes ?? []
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    if (useCache) {
      await cache.set(cacheKey, dashboardData, cacheTTLSeconds);
    }

    const loadTime = Date.now() - startTime;
    logger.info('Admin dashboard loaded', { loadTime });

    return NextResponse.json({
      ...dashboardData,
      fromCache: false,
      loadTime
    });

  } catch (error) {
    logger.error('Optimized admin dashboard API error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Load admin overview statistics with optimized queries
 */
async function loadAdminOverview(supabase: any): Promise<AdminDashboardData['overview']> {
  const cacheKey = 'admin:overview';
  const cache = await getRedisClient();
  const cacheTTLSeconds = 60 * 5;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached && typeof cached === 'object' && 'total_users' in cached && 'total_polls' in cached) {
    return cached as AdminDashboardData['overview'];
  }

  try {
    // Load data in parallel
    const [usersResult, pollsResult, votesResult, activePollsResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('polls').select('id', { count: 'exact', head: true }),
      supabase.from('votes').select('id', { count: 'exact', head: true }),
      supabase.from('polls').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    const result = {
      total_users: usersResult.count ?? 0,
      total_polls: pollsResult.count ?? 0,
      total_votes: votesResult.count ?? 0,
      active_polls: activePollsResult.count ?? 0,
      new_users_last_7_days: 0, // Would need separate query
      engagement_rate: 0 // Would need calculation
    };

    await cache.set(cacheKey, result, cacheTTLSeconds);
    return result;

  } catch (error) {
    logger.error('Error loading admin overview:', error instanceof Error ? error : new Error(String(error)));
    return {
      total_users: 0,
      total_polls: 0,
      total_votes: 0,
      active_polls: 0,
      new_users_last_7_days: 0,
      engagement_rate: 0
    };
  }
}

/**
 * Load admin analytics data
 */
async function loadAdminAnalytics(_supabase: any) {
  const cacheKey = 'admin:analytics';
  const cache = await getRedisClient();
  const cacheTTLSeconds = 60 * 10;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Mock analytics data for now - would integrate with real analytics
    const result = {
      user_growth: [
        { date: '2025-10-12', new_users: 15, total_users: 150 },
        { date: '2025-10-13', new_users: 23, total_users: 173 },
        { date: '2025-10-14', new_users: 18, total_users: 191 },
        { date: '2025-10-15', new_users: 31, total_users: 222 },
        { date: '2025-10-16', new_users: 27, total_users: 249 },
        { date: '2025-10-17', new_users: 35, total_users: 284 },
        { date: '2025-10-18', new_users: 42, total_users: 326 }
      ],
      poll_activity: [
        { date: '2025-10-12', polls_created: 8, votes_cast: 156 },
        { date: '2025-10-13', polls_created: 12, votes_cast: 234 },
        { date: '2025-10-14', polls_created: 9, votes_cast: 187 },
        { date: '2025-10-15', polls_created: 15, votes_cast: 298 },
        { date: '2025-10-16', polls_created: 11, votes_cast: 221 },
        { date: '2025-10-17', polls_created: 18, votes_cast: 356 },
        { date: '2025-10-18', polls_created: 14, votes_cast: 289 }
      ],
      top_categories: [
        { category: 'Politics', poll_count: 45, vote_count: 1234 },
        { category: 'Technology', poll_count: 32, vote_count: 987 },
        { category: 'Environment', poll_count: 28, vote_count: 756 },
        { category: 'Education', poll_count: 21, vote_count: 543 },
        { category: 'Health', poll_count: 18, vote_count: 432 }
      ]
    };

    await cache.set(cacheKey, result, cacheTTLSeconds);
    return result;

  } catch (error) {
    logger.error('Error loading admin analytics:', error instanceof Error ? error : new Error(String(error)));
    return {
      user_growth: [],
      poll_activity: [],
      top_categories: []
    };
  }
}

/**
 * Load system health metrics
 */
async function loadSystemHealth(supabase: any) {
  const cacheKey = 'admin:system_health';
  const cache = await getRedisClient();
  const _cacheTTLSeconds = 60;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Test database connectivity
    const startTime = Date.now();
    const { error: dbError } = await supabase.from('user_profiles').select('id').limit(1);
    const dbLatency = Date.now() - startTime;

    const result = {
      status: dbError ? 'degraded' : 'operational',
      database_latency_ms: dbLatency,
      uptime_percentage: dbError ? 0 : 100,
      last_health_check: new Date().toISOString()
    };

    // Optionally cache briefly
    // await cache.set(cacheKey, result, cacheTTLSeconds);
    return result;

  } catch (error) {
    logger.error('Error loading system health:', error instanceof Error ? error : new Error(String(error)));
    return {
      status: 'degraded',
      database_latency_ms: 0,
      uptime_percentage: 0,
      last_health_check: new Date().toISOString()
    };
  }
}

/**
 * Load recent activity data
 */
async function loadRecentActivity(supabase: any) {
  const cacheKey = 'admin:recent_activity';
  const cache = await getRedisClient();
  const cacheTTLSeconds = 60 * 2;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Load recent data in parallel
    const [newUsersResult, recentPollsResult, recentVotesResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('polls')
        .select('id, title, created_by, created_at, total_votes')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('votes')
        .select('id, poll_id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const result = {
      new_users: newUsersResult.data ?? [],
      recent_polls: recentPollsResult.data ?? [],
      recent_votes: recentVotesResult.data ?? []
    };

    await cache.set(cacheKey, result, cacheTTLSeconds);
    return result;

  } catch (error) {
    logger.error('Error loading recent activity:', error instanceof Error ? error : new Error(String(error)));
    return {
      new_users: [],
      recent_polls: [],
      recent_votes: []
    };
  }
}
