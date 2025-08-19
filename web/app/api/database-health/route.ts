import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth, queryMonitor } from '@/lib/database-optimizer';
import { devLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database health
    const health = await checkDatabaseHealth();
    
    // Get performance metrics
    const performanceMetrics = {
      averageQueryTime: queryMonitor.getAverageQueryTime(),
      errorRate: queryMonitor.getErrorRate(),
      slowQueries: queryMonitor.getSlowQueries().length,
      totalQueries: queryMonitor.getSlowQueries(0).length, // All queries
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (health.queryTime && health.queryTime > 1000) {
      recommendations.push('Consider adding database indexes for poll queries');
    }
    
    if (performanceMetrics.errorRate > 1) {
      recommendations.push('High error rate detected - review database connections');
    }
    
    if (performanceMetrics.averageQueryTime > 500) {
      recommendations.push('Average query time is high - consider query optimization');
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      responseTime,
      health,
      performance: performanceMetrics,
      recommendations,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        databaseType: 'supabase',
        monitoring: 'active'
      }
    });

  } catch (error) {
    devLog('Database health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      health: {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0,
        warnings: ['Health check failed']
      },
      performance: {
        averageQueryTime: 0,
        errorRate: 100,
        slowQueries: 0,
        totalQueries: 0
      },
      recommendations: ['Database health monitoring is not available']
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'clear_metrics':
        queryMonitor.clearMetrics();
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
        const report = {
          averageQueryTime: queryMonitor.getAverageQueryTime(),
          errorRate: queryMonitor.getErrorRate(),
          slowQueries: queryMonitor.getSlowQueries(),
          totalQueries: queryMonitor.getSlowQueries(0).length
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
    devLog('Database health action error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
