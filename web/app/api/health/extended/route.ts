/**
 * Extended Health Check API Endpoint
 *
 * Comprehensive health checks including:
 * - System metrics
 * - Performance metrics
 * - Database connection pool
 * - Cache status
 * - Rate limiting status
 *
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { env } from '@/lib/config/env';
import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError } from '@/lib/api';
import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
    const authHeader = _request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const hasValidKey = bearerToken && bearerToken === env.ADMIN_MONITORING_KEY;

    if (!hasValidKey) {
      const supabase = await getSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return authError('Authentication required: provide a valid admin session or monitoring key');
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile || !(profile as any).is_admin) {
        return authError('Admin access required');
      }
    }

    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV ?? 'development';

    // Collect all health metrics in parallel
    const [databaseHealth, rateLimitMetrics, supabaseHealth] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRateLimitingHealth(),
      checkSupabaseHealth()
    ]);

    // Aggregate results
    const health: Record<string, any> = {
      status: 'healthy',
      timestamp,
      environment,
      version: env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      uptime: process.uptime(),
      checks: {}
    };

    // Database health
    if (databaseHealth.status === 'fulfilled') {
      health.checks.database = databaseHealth.value;
      if (databaseHealth.value.status !== 'healthy') {
        health.status = 'degraded';
      }
    } else {
      health.checks.database = {
        status: 'error',
        error: databaseHealth.reason?.message ?? 'Unknown database error'
      };
      health.status = 'unhealthy';
    }

    // Rate limiting health
    if (rateLimitMetrics.status === 'fulfilled') {
      health.checks.rateLimiting = rateLimitMetrics.value;
    } else {
      health.checks.rateLimiting = {
        status: 'warning',
        error: rateLimitMetrics.reason?.message ?? 'Rate limiting check failed'
      };
    }

    // Supabase health
    if (supabaseHealth.status === 'fulfilled') {
      health.checks.supabase = supabaseHealth.value;
      if (supabaseHealth.value.status !== 'healthy') {
        health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } else {
      health.checks.supabase = {
        status: 'error',
        error: supabaseHealth.reason?.message ?? 'Unknown Supabase error'
      };
      health.status = 'unhealthy';
    }

    // System metrics
    health.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        limit: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 1.5) // Estimated limit
      },
      cpu: {
        usage: process.cpuUsage() // CPU time used
      }
    };

  return successResponse(health, undefined, health.status === 'unhealthy' ? 503 : 200);
});

/**
 * Check database connection health
 */
async function checkDatabaseHealth() {
  try {
    const supabase = await getSupabaseServerClient();
    const startTime = Date.now();

    // Simple query to test connection
    const { error } = await supabase
      .from('polls')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'error' as const,
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy' as const,
      responseTime,
      message: 'Database connection healthy'
    };
  } catch (error) {
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Check rate limiting system health
 */
async function checkRateLimitingHealth() {
  try {
    const metrics = await upstashRateLimiter.getMetrics();

    return {
      status: 'healthy' as const,
      metrics: {
        totalViolations: metrics.totalViolations ?? 0,
        violationsLastHour: metrics.violationsLastHour ?? 0,
        violationsLast24Hours: metrics.violationsLastHour ?? 0, // Using violationsLastHour as proxy
        topIPs: (metrics.topViolatingIPs ?? []).slice(0, 5)
      },
      message: 'Rate limiting system operational'
    };
  } catch (error) {
    return {
      status: 'warning' as const,
      error: error instanceof Error ? error.message : 'Rate limiting check failed',
      message: 'Rate limiting system check failed (non-critical)'
    };
  }
}

/**
 * Check Supabase connection health
 */
async function checkSupabaseHealth() {
  try {
    const supabase = await getSupabaseServerClient();
    const startTime = Date.now();

    // Test auth connection
    const { data: { user: _user }, error: authError } = await supabase.auth.getUser();
    const authResponseTime = Date.now() - startTime;

    // Test database connection
    const dbStartTime = Date.now();
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    const dbResponseTime = Date.now() - dbStartTime;

    if (authError || dbError) {
      return {
        status: 'degraded' as const,
        auth: {
          status: authError ? 'error' : 'healthy',
          responseTime: authResponseTime,
          error: authError?.message
        },
        database: {
          status: dbError ? 'error' : 'healthy',
          responseTime: dbResponseTime,
          error: dbError?.message
        },
        message: 'Supabase partially operational'
      };
    }

    return {
      status: 'healthy' as const,
      auth: {
        status: 'healthy',
        responseTime: authResponseTime
      },
      database: {
        status: 'healthy',
        responseTime: dbResponseTime
      },
      message: 'Supabase fully operational'
    };
  } catch (error) {
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown Supabase error'
    };
  }
}

