/**
 * Pre-Launch Checklist API Endpoint
 * 
 * Provides endpoints for running and managing pre-launch checklist validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PreLaunchChecklist } from '@/lib/deployment/pre-launch-checklist';
import { logger } from '@/lib/logger';

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
            lastRun: null,
            readyForLaunch: false
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
    logger.error('Failed to get pre-launch checklist status', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve checklist status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'run':
        logger.info('Starting pre-launch checklist execution');
        
        const result = await PreLaunchChecklist.runFullChecklist();
        
        return NextResponse.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to run pre-launch checklist', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run pre-launch checklist',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
