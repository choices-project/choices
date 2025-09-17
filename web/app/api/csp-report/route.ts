/**
 * CSP Violation Reporting Endpoint
 * 
 * Collects Content Security Policy violation reports for monitoring and debugging.
 * This endpoint receives POST requests with CSP violation data from browsers.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    
    // Log CSP violation for debugging
    console.error('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      report: report,
    });
    
    // In production, you might want to:
    // 1. Store in database
    // 2. Send to monitoring service (Sentry, DataDog, etc.)
    // 3. Alert security team for critical violations
    
    // Example: Store in database (uncomment when ready)
    // await storeCSPViolation({
    //   timestamp: new Date(),
    //   userAgent: request.headers.get('user-agent'),
    //   report: report,
    //   ip: request.ip,
    // });
    
    // Example: Send to monitoring service (uncomment when ready)
    // await sendToMonitoring({
    //   type: 'csp_violation',
    //   data: report,
    //   metadata: {
    //     userAgent: request.headers.get('user-agent'),
    //     ip: request.ip,
    //   }
    // });
    
    return NextResponse.json({ status: 'received' }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing CSP violation report:', error);
    
    // Still return 200 to prevent browser from retrying
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
