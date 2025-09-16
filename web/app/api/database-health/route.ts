import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withAuth, createRateLimitMiddleware, combineMiddleware } from '@/lib/core/auth/middleware'
import { getQueryOptimizer, connectionPoolManager, queryMonitor, withPerformanceMonitoring } from '@/lib/core/database/optimizer'

export const dynamic = 'force-dynamic';

// Rate limiting: 30 requests per minute per IP
const rateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 30,
  windowMs: 60 * 1000
})

// Combined middleware: rate limiting + optional auth
const middleware = combineMiddleware(rateLimitMiddleware)

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await middleware(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Use optimized health check with performance monitoring
    const queryOptimizer = await getQueryOptimizer()
    const getHealthOptimized = withPerformanceMonitoring(
      () => queryOptimizer.getDatabaseHealth(),
      'database_health_check'
    )

    const healthData = await getHealthOptimized()

    // Get connection pool metrics
    const poolHealth = connectionPoolManager.getHealth()
    const poolMetrics = connectionPoolManager.getMetrics()

    // Get query performance statistics
    const queryStats = queryMonitor.getStats()
    const slowQueries = queryMonitor.getSlowQueries()

    const response = {
      ...healthData,
      connectionPool: {
        status: poolHealth.status,
        utilizationRate: poolHealth.utilizationRate,
        metrics: poolMetrics
      },
      performance: {
        queryStats,
        slowQueries: slowQueries.slice(0, 5), // Top 5 slow queries
        optimizationEnabled: true,
        cacheEnabled: true
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    }

    // Add admin-only information if user is admin
    if (context.user.trust_tier === 'T3') {
      (response as any).adminInfo = {
        databaseSize: 'N/A', // Would need special permissions
        connectionPool: poolMetrics,
        lastBackup: 'N/A', // Would need special permissions
        maintenanceMode: false,
        cacheStats: 'Available via cache_monitor view',
        slowQueryDetails: slowQueries
      }
    }

    // Return appropriate status code based on health
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    // narrow 'unknown' → Error
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Database health check error:', err);
    
    return NextResponse.json({
      status: 'unhealthy',
      healthPercentage: 0,
      responseTime: 'N/A',
      timestamp: new Date().toISOString(),
      tests: [],
      metrics: { users: 'unknown', polls: 'unknown', votes: 'unknown' },
      recentErrors: [],
      error: 'Health check failed',
      connectionPool: {
        status: 'unknown',
        utilizationRate: 0,
        metrics: { totalConnections: 0, activeConnections: 0, idleConnections: 0, waitingConnections: 0 }
      },
      performance: {
        queryStats: { totalQueries: 0, averageQueryTime: 0, slowQueries: 0, topSlowQueries: [] },
        slowQueries: [],
        optimizationEnabled: false,
        cacheEnabled: false
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    }, { status: 503 })
  }
}, { allowPublic: true }) // Allow public access to health checks

export async function POST(_request: NextRequest) {
  try {
    const { action } = await _request.json();

    switch (action) {
      case 'clear_metrics':
        queryMonitor.reset();
        return NextResponse.json({
          status: 'success',
          message: 'Performance metrics cleared',
          timestamp: new Date().toISOString()
        });

      case 'get_slow_queries':
        const slowQueries = queryMonitor.getSlowQueries();
        return NextResponse.json({
          status: 'success',
          slowQueries,
          count: slowQueries.length,
          timestamp: new Date().toISOString()
        });

      case 'get_performance_report':
        const stats = queryMonitor.getStats();
        const report = {
          averageQueryTime: stats.averageQueryTime,
          errorRate: 0, // Not tracked in current implementation
          slowQueries: queryMonitor.getSlowQueries(),
          totalQueries: stats.totalQueries
        };
        
        return NextResponse.json({
          status: 'success',
          report,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action',
          validActions: ['clear_metrics', 'get_slow_queries', 'get_performance_report']
        }, { status: 400 });
    }

  } catch (error) {
    // devLog('Database health action error:', error); // This line was removed from the new_code, so it's removed here.
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
