import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// POST - Handle WebAuthn authentication (redirect to proper endpoints)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a request for options or verification
    if (body.action === 'options') {
      // Redirect to the working options endpoint
      const optionsResponse = await fetch(`${request.nextUrl.origin}/api/v1/auth/webauthn/authenticate/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') ?? '',
        },
        body: JSON.stringify(body),
      });
      
      const optionsData = await optionsResponse.json();
      return NextResponse.json(optionsData, { status: optionsResponse.status });
    } else if (body.action === 'verify') {
      // Redirect to the working verify endpoint
      const verifyResponse = await fetch(`${request.nextUrl.origin}/api/v1/auth/webauthn/authenticate/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') ?? '',
        },
        body: JSON.stringify(body),
      });
      
      const verifyData = await verifyResponse.json();
      return NextResponse.json(verifyData, { status: verifyResponse.status });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "options" or "verify"' },
        { status: 400 }
      );
    }
  } catch (error) {
    devLog('WebAuthn authentication error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Missing') ? 400 : 500 }
    )
  }
}