import { NextResponse } from 'next/server';
import { getOrSetCsrfCookie } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * CSRF Token Endpoint
 * 
 * Provides CSRF tokens to clients for API request protection
 * GET: Returns current CSRF token (creates one if none exists)
 */

export async function GET() {
  try {
    // Get or create CSRF token
    const csrfToken = getOrSetCsrfCookie();

    return NextResponse.json({
      csrfToken,
      message: 'CSRF token retrieved successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
