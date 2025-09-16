/**
 * Load Testing API Endpoint
 * 
 * Provides endpoints for running load tests and performance validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoadTestingFramework } from '@/lib/testing/load-testing';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, config } = body;
    
    let result;
    
    switch (testType) {
      case '1m-ballot':
        logger.info('Starting 1M ballot load test');
        result = await LoadTestingFramework.run1MBallotTest();
        break;
        
      case 'concurrent-users':
        const { concurrentUsers = 1000, usersPerSecond = 100 } = config || {};
        logger.info('Starting concurrent user load test', { concurrentUsers, usersPerSecond });
        result = await LoadTestingFramework.runConcurrentUserTest(concurrentUsers, usersPerSecond);
        break;
        
      case 'spike':
        logger.info('Starting spike load test');
        result = await LoadTestingFramework.runSpikeTest();
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Must be one of: 1m-ballot, concurrent-users, spike'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to run load test', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run load test',
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
            availableTests: ['1m-ballot', 'concurrent-users', 'spike'],
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
    logger.error('Failed to get load testing status', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve load testing status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
