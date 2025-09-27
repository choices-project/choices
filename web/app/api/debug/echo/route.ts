/**
 * Debug Echo Endpoint
 * 
 * Provides debugging information for E2E tests, including:
 * - E2E bypass headers and query parameters
 * - Request metadata for troubleshooting
 * 
 * Created: January 18, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  return NextResponse.json({
    // E2E bypass detection
    e2eHeader: request.headers.get('x-e2e-bypass') ?? null,
    e2eQuery: url.searchParams.get('e2e') ?? null,
    e2eCookie: request.cookies.get('E2E')?.value ?? null,
    
    // Request metadata
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') ?? null,
    ip: request.ip ?? null,
    
    // Environment info
    nodeEnv: process.env.NODE_ENV,
    e2eEnv: process.env.E2E,
    
    // Timestamp
    timestamp: new Date().toISOString(),
  });
}
