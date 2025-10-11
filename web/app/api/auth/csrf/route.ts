import { NextResponse } from 'next/server';
import { getOrSetCsrfCookie } from '../_shared';
import { CSRF_COOKIE } from '../_shared/cookies';
import { createApiLogger } from '@/lib/utils/api-logger';

export const dynamic = 'force-dynamic';

/**
 * CSRF Token Endpoint
 * 
 * Provides CSRF tokens to clients for API request protection
 * GET: Returns current CSRF token (creates one if none exists)
 */

export async function GET() {
  const logger = createApiLogger('/api/auth/csrf', 'GET');
  
  try {
    // Get or create CSRF token
    const csrfToken = getOrSetCsrfCookie();
    
    // Create response
    const response = NextResponse.json({
      csrfToken,
      message: 'CSRF token retrieved successfully'
    });
    
    // Set CSRF cookie in response
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false, // Client needs to read this
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    logger.error('CSRF token generation error', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
