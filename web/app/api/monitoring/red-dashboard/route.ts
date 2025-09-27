/**
 * Red Dashboard API Endpoint - STUB VERSION
 * 
 * Temporarily disabled due to missing dependencies
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Red dashboard temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}
