/**
 * Red Dashboard API Endpoint
 * 
 * Provides real-time critical metrics dashboard for system health monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RedDashboard } from '@/lib/monitoring/red-dashboards';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    
    if (format === 'json') {
      // Return JSON metrics
      const metrics = await RedDashboard.getCriticalMetrics();
      return NextResponse.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return HTML dashboard
      const dashboardHTML = await RedDashboard.generateDashboardHTML();
      return new NextResponse(dashboardHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (error) {
    logger.error('Failed to generate red dashboard', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate dashboard',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
