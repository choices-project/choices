/**
 * Load Testing API Endpoint - STUB VERSION
 * 
 * Temporarily disabled due to missing dependencies
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log load test request for audit trail
  console.log(`Load test POST request from: ${request.headers.get('user-agent') || 'unknown'}`);
  
  return NextResponse.json({
    success: false,
    error: 'Load testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}

export async function GET(request: NextRequest) {
  // Log load test request for audit trail
  console.log(`Load test GET request from: ${request.headers.get('user-agent') || 'unknown'}`);
  
  return NextResponse.json({
    success: false,
    error: 'Load testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}
