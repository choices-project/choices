/**
 * Chaos Testing API Endpoint
 * 
 * Provides endpoints for running chaos engineering drills and tests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChaosTestingFramework } from '@/lib/chaos/chaos-testing';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drillType, dryRun = false } = body;
    
    if (!drillType || !['redis', 'database', 'network', 'full'].includes(drillType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid drill type. Must be one of: redis, database, network, full'
      }, { status: 400 });
    }
    
    logger.info(`Starting chaos drill: ${drillType}`, { drillType, dryRun });
    
    const result = await ChaosTestingFramework.runChaosDrill(drillType as any);
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to run chaos drill', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run chaos drill',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            status: 'ready',
            availableDrills: ['redis', 'database', 'network', 'full'],
            lastRun: null
          },
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to get chaos testing status', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve chaos testing status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
