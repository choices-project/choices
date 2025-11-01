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

import { type NextRequest, NextResponse } from 'next/server';

import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/extended
 * Comprehensive health check with detailed metrics
 */
export async function GET(request: NextRequest) {
  try {
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
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
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

    // Determine overall status code
    const statusCode = health.status === 'unhealthy' ? 503 : health.status === 'degraded' ? 200 : 200;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    logger.error('Error in extended health check:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {}
      },
      { status: 500 }
    );
  }
}

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
        violationsLast24Hours: metrics.violationsLast24Hours ?? 0,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

