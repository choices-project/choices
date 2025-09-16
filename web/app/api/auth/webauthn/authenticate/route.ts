import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticationOptions, verifyCredential } from '@/features/webauthn/server/authenticate';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic'

// POST - Handle WebAuthn authentication (both getting options and verifying)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If credential is provided, this is a verification request
    if (body.credential) {
      const result = await verifyCredential(body);
      
      // Set session cookie
      const response = NextResponse.json({
        success: result.success,
        message: result.message,
        user: result.user
      })

      response.cookies.set('choices_session', JSON.stringify(result.sessionToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      return response;
    }
    
    // Otherwise, this is a request for authentication options
    const result = await getAuthenticationOptions(body);
    return NextResponse.json(result);
    
  } catch (error) {
    devLog('WebAuthn authentication error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Missing') ? 400 : 500 }
    )
  }
}