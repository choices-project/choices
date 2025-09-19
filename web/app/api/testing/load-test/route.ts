/**
 * Load Testing API Endpoint - STUB VERSION
 * 
 * Temporarily disabled due to missing dependencies
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Load testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Load testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}
