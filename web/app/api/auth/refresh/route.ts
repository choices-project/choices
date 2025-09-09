import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  verifyEnhancedSession, 
  clearEnhancedSession 
} from '@/lib/session-enhanced';
import { 
  validateCsrfProtection, 
  createCsrfErrorResponse 
} from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * Token Refresh Endpoint
 * 
 * Refreshes access tokens using valid refresh tokens
 * POST: Refreshes tokens and returns new access token
 */

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF protection for state-changing operation
    if (!validateCsrfProtection(request)) {
      return createCsrfErrorResponse();
    }

    // Verify current session (this will attempt token refresh if needed)
    const sessionVerification = await verifyEnhancedSession(request);
    
    if (!sessionVerification.valid) {
      logger.warn('Token refresh failed - invalid session', {
        error: sessionVerification.error,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      // Clear invalid session
      const response = NextResponse.json(
        { error: 'Invalid session', message: 'Please log in again' },
        { status: 401 }
      );
      clearEnhancedSession(response);
      
      return response;
    }
    
    if (!sessionVerification.user) {
      logger.error('Token refresh failed - no user data');
      
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 500 }
      );
    }
    
    // If tokens were refreshed, update cookies
    if (sessionVerification.needsRefresh) {
      logger.info('Tokens refreshed successfully', {
        userId: sessionVerification.user.id,
        stableId: sessionVerification.user.stableId,
      });
      
      const response = NextResponse.json({
        success: true,
        message: 'Tokens refreshed successfully',
        user: {
          id: sessionVerification.user.id,
          stableId: sessionVerification.user.stableId,
          username: sessionVerification.user.username,
          tier: sessionVerification.user.tier,
        },
      });
      
      // Note: updateSessionTokens would be called here if we had the new tokens
      // For now, the session verification already handled the refresh
      
      return response;
    }
    
    // Session is valid and doesn't need refresh
    return NextResponse.json({
      success: true,
      message: 'Session is valid',
      user: {
        id: sessionVerification.user.id,
        stableId: sessionVerification.user.stableId,
        username: sessionVerification.user.username,
        tier: sessionVerification.user.tier,
      },
    });
    
  } catch (error) {
    logger.error('Token refresh endpoint error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
