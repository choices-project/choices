/**
 * Performance Dashboard API
 * 
 * API endpoints for accessing performance monitoring data and insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { smartCache } from '@/lib/database/smart-cache';
import { queryAnalyzer } from '@/lib/database/query-analyzer';

/**
 * GET /api/admin/performance
 * Get current performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'current';

    // If optimization suite is disabled, only provide minimal telemetry
    if (!isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
      if (type === 'minimal') {
        const { minimalTelemetry } = await import('@/lib/telemetry/minimal');
        const metrics = minimalTelemetry.getMetrics();
        
        return NextResponse.json({
          success: true,
          data: metrics,
          message: 'Minimal telemetry data (optimization suite disabled)',
          timestamp: Date.now(),
        });
      }
      
      return NextResponse.json({ 
        error: 'Database optimization suite is disabled',
        message: 'Enable FEATURE_DB_OPTIMIZATION_SUITE to access full performance data, or use ?type=minimal for basic metrics'
      }, { status: 403 });
    }
    const format = searchParams.get('format') || 'json';
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Dynamically import optimization modules
    const { performanceDashboard } = await import('@/lib/database/performance-dashboard');

    let data: unknown;

    switch (type) {
      case 'current':
        data = performanceDashboard.getCurrentMetrics();
        break;
      
      case 'summary':
        data = performanceDashboard.getPerformanceSummary();
        break;
      
      case 'recommendations':
        data = performanceDashboard.getOptimizationRecommendations();
        break;
      
      case 'history':
        if (startTime && endTime) {
          data = performanceDashboard.getMetricsForTimeRange(
            parseInt(startTime),
            parseInt(endTime)
          );
        } else {
          data = performanceDashboard.getMetricsHistory();
        }
        break;
      
      case 'export':
        data = performanceDashboard.exportMetrics(format as 'json' | 'csv');
        break;
      
      case 'cache':
        data = smartCache.getStats();
        break;
      
      case 'queries':
        data = queryAnalyzer.generateOptimizationReport();
        break;
      
      case 'indexes':
        data = queryAnalyzer.getIndexRecommendations();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    if (type === 'export') {
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      return new NextResponse(data as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="performance-${type}-${Date.now()}.${format}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });

  } catch (error) {
    logger.error('Error in performance API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance
 * Control dashboard operations
 */
export async function POST(request: NextRequest) {
  try {
    // Check if optimization suite is enabled
    if (!isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
      return NextResponse.json({ 
        error: 'Database optimization suite is disabled',
        message: 'Enable FEATURE_DB_OPTIMIZATION_SUITE to control performance monitoring'
      }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Dynamically import optimization modules
    const { performanceDashboard } = await import('@/lib/database/performance-dashboard');

    switch (action) {
      case 'start':
        performanceDashboard.start();
        return NextResponse.json({
          success: true,
          message: 'Performance dashboard started',
        });
      
      case 'stop':
        performanceDashboard.stop();
        return NextResponse.json({
          success: true,
          message: 'Performance dashboard stopped',
        });
      
      case 'clear':
        performanceDashboard.clearHistory();
        return NextResponse.json({
          success: true,
          message: 'Performance history cleared',
        });
      
      case 'invalidate_cache':
        const { tags, pattern } = body;
        let invalidatedCount = 0;
        
        if (tags && Array.isArray(tags)) {
          invalidatedCount = smartCache.invalidateByTags(tags);
        } else if (pattern) {
          invalidatedCount = smartCache.invalidateByPattern(pattern);
        } else {
          return NextResponse.json(
            { error: 'Either tags or pattern must be provided' },
            { status: 400 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: `Cache invalidated: ${invalidatedCount} entries`,
          invalidatedCount,
        });
      
      case 'optimize':
        smartCache.optimizeConfiguration();
        return NextResponse.json({
          success: true,
          message: 'Cache configuration optimized',
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Error in performance API POST', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * WebSocket endpoint for real-time updates
 * Note: This would require WebSocket support in your Next.js setup
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'subscribe') {
      // In a real implementation, you would set up WebSocket connection here
      // For now, we'll return a subscription ID
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        subscriptionId,
        message: 'Subscription created (WebSocket not implemented)',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error in performance API PUT', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
