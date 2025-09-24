/**
 * Chaos Testing API Endpoint - STUB VERSION
 * 
 * Temporarily disabled due to missing dependencies
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Chaos testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Chaos testing temporarily disabled - missing dependencies',
    timestamp: new Date().toISOString()
  }, { status: 503 });
}
