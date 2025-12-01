import type { NextRequest } from 'next/server';

import {
  authError,
  errorResponse,
  forbiddenError,
  successResponse,
  withErrorHandling,
} from '@/lib/api';
import { logAnalyticsAccessToDatabase } from '@/lib/auth/adminGuard';
import { getRedisClient } from '@/lib/cache/redis-client';
import { createAuditLogService } from '@/lib/services/audit-log-service';
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
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();

  const { searchParams } = new URL(request.url);
  const include = searchParams.get('include') ?? 'all';
  const includeArray = include.split(',').map((item) => item.trim());
  const useCache = searchParams.get('cache') !== 'false';

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const auditLog = createAuditLogService(supabase);
    await auditLog.logSecurityEvent('Unauthorized Dashboard Access', 'warning', '/api/admin/dashboard', {
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: { reason: 'no_auth' },
    });

    return authError('Authentication required');
  }

  const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('user_id', user.id).single();
  const isAdmin = profile?.is_admin ?? false;

  if (!isAdmin) {
    await logAnalyticsAccessToDatabase(supabase, user, '/api/admin/dashboard', false, {
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        reason: 'not_admin',
        user_email: user.email,
      },
    });

    return forbiddenError('Admin access required');
  }

  await logAnalyticsAccessToDatabase(supabase, user, '/api/admin/dashboard', true, {
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    metadata: {
      includes: includeArray,
      use_cache: useCache,
      admin_email: user.email,
    },
  });

  const cache = await getRedisClient();
  const cacheKey = 'admin:dashboard';
  const cacheTTLSeconds = 60 * 5;

  if (useCache && cache) {
    const cachedData = await cache.get<AdminDashboardData>(cacheKey);
    if (cachedData) {
      const loadTime = Date.now() - startTime;
      logger.info('Admin dashboard loaded from cache', { loadTime });
      return successResponse(
        {
          dashboard: cachedData,
          fromCache: true,
          loadTime,
        },
        { source: 'cache' }
      );
    }
  }

  logger.debug('Loading admin dashboard data from database');

  const [overview, analytics, systemHealth, recentActivity] = await Promise.all([
    loadAdminOverview(supabase),
    includeArray.includes('analytics') ? loadAdminAnalytics(supabase) : Promise.resolve(null),
    includeArray.includes('health') ? loadSystemHealth(supabase) : Promise.resolve(null),
    includeArray.includes('activity') ? loadRecentActivity(supabase) : Promise.resolve(null),
  ]);

  const dashboardData: AdminDashboardData = {
    admin_user: {
      id: user.id,
      email: user.email ?? '',
      name: user.email?.split('@')[0] ?? 'Admin',
    },
    overview,
    analytics: {
      user_growth: (analytics as any)?.user_growth ?? [],
      poll_activity: (analytics as any)?.poll_activity ?? [],
      top_categories: (analytics as any)?.top_categories ?? [],
    },
    system_health: {
      status: (systemHealth as any)?.status ?? 'unknown',
      database_latency_ms: (systemHealth as any)?.database_latency_ms ?? 0,
      uptime_percentage: (systemHealth as any)?.uptime_percentage ?? 0,
      last_health_check: (systemHealth as any)?.last_health_check ?? new Date().toISOString(),
    },
    recent_activity: {
      new_users: (recentActivity as any)?.new_users ?? [],
      recent_polls: (recentActivity as any)?.recent_polls ?? [],
      recent_votes: (recentActivity as any)?.recent_votes ?? [],
    },
    generatedAt: new Date().toISOString(),
  };

  if (useCache && cache) {
    await cache.set(cacheKey, dashboardData, cacheTTLSeconds);
  }

  const loadTime = Date.now() - startTime;
  logger.info('Admin dashboard loaded', { loadTime });

  return successResponse(
    {
      dashboard: dashboardData,
      fromCache: false,
      loadTime,
    },
    { source: 'database' }
  );
});

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
async function loadAdminAnalytics(supabase: any) {
  const cacheKey = 'admin:analytics';
  const cache = await getRedisClient();
  const cacheTTLSeconds = 60 * 10;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Fetch real analytics data from Supabase
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get user growth (last 7 days)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    if (usersError) {
      logger.error('Error fetching user growth:', usersError);
    }

    // Get initial user count
    const { count: initialCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDateStr);

    // Group users by date
    const userGrowthMap = new Map<string, number>();
    let cumulative = initialCount ?? 0;

    users?.forEach((user: any) => {
      const date = user.created_at?.split('T')[0];
      if (date) {
        userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
      }
    });

    const user_growth = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const newUsers = userGrowthMap.get(dateStr) || 0;
      cumulative += newUsers;
      return {
        date: dateStr,
        new_users: newUsers,
        total_users: cumulative,
      };
    });

    // Get poll activity (last 7 days)
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, created_at')
      .gte('created_at', startDateStr);

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id, created_at, poll_id')
      .gte('created_at', startDateStr);

    if (pollsError || votesError) {
      logger.error('Error fetching poll activity:', pollsError || votesError);
    }

    // Group polls and votes by date
    const pollActivityMap = new Map<string, { polls: number; votes: number }>();
    polls?.forEach((poll: any) => {
      const date = poll.created_at?.split('T')[0];
      if (date) {
        const current = pollActivityMap.get(date) || { polls: 0, votes: 0 };
        current.polls++;
        pollActivityMap.set(date, current);
      }
    });

    votes?.forEach((vote: any) => {
      const date = vote.created_at?.split('T')[0];
      if (date) {
        const current = pollActivityMap.get(date) || { polls: 0, votes: 0 };
        current.votes++;
        pollActivityMap.set(date, current);
      }
    });

    const poll_activity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = pollActivityMap.get(dateStr) || { polls: 0, votes: 0 };
      return {
        date: dateStr,
        polls_created: activity.polls,
        votes_cast: activity.votes,
      };
    });

    // Get top categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('polls')
      .select('category, id')
      .gte('created_at', startDateStr)
      .not('category', 'is', null);

    if (categoryError) {
      logger.error('Error fetching categories:', categoryError);
    }

    const categoryMap = new Map<string, { poll_count: number; vote_count: number }>();
    const pollIds = new Set(polls?.map((p: any) => p.id) || []);

    categoryData?.forEach((poll: any) => {
      const category = poll.category || 'Uncategorized';
      const current = categoryMap.get(category) || { poll_count: 0, vote_count: 0 };
      current.poll_count++;
      categoryMap.set(category, current);
    });

    // Count votes per category
    votes?.forEach((vote: any) => {
      const poll = polls?.find((p: any) => p.id === vote.poll_id);
      if (poll?.category) {
        const current = categoryMap.get(poll.category) || { poll_count: 0, vote_count: 0 };
        current.vote_count++;
        categoryMap.set(poll.category, current);
      }
    });

    const top_categories = Array.from(categoryMap.entries())
      .map(([category, counts]) => ({
        category,
        poll_count: counts.poll_count,
        vote_count: counts.vote_count,
      }))
      .sort((a, b) => b.poll_count - a.poll_count)
      .slice(0, 5);

    const result = {
      user_growth,
      poll_activity,
      top_categories,
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
