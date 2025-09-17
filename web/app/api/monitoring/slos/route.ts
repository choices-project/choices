/**
 * SLO Monitoring API Endpoint
 * 
 * Provides Service Level Objective metrics and alerting information.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { sloMonitor } from '@/lib/monitoring/slos';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    
    switch (action) {
      case 'metrics':
        const metrics = sloMonitor.getSLOMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
        
      case 'alerts':
        const alerts = sloMonitor.getActiveAlerts();
        return NextResponse.json({
          success: true,
          data: alerts,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to get SLO data', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve SLO data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sloName, value, timestamp } = body;
    
    if (!sloName || value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sloName, value'
      }, { status: 400 });
    }
    
    await sloMonitor.recordMetric(sloName, value, timestamp);
    
    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to record SLO metric', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record metric',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
