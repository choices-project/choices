/**
 * Enhanced Session Management Library
 * 
 * Integrates enhanced JWT tokens with secure cookie management
 * Provides comprehensive session lifecycle management
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  createTokenPair, 
  verifyAccessToken, 
  verifyRefreshToken,
  refreshAccessToken,
  getTimeUntilExpiration,
  type TokenUser,
  type TokenResult
} from './jwt-enhanced';
import { 
  setSessionCookie, 
  clearSessionCookie,
  setCsrfCookie,
  clearCsrfCookie,
  SESSION_COOKIE
} from '../app/api/auth/_shared';

// Cookie names for different token types
const ACCESS_TOKEN_COOKIE = SESSION_COOKIE;
const REFRESH_TOKEN_COOKIE = process.env.NODE_ENV === 'production' 
  ? '__Host-choices_refresh' 
  : 'choices_refresh';

/**
 * Enhanced session user interface
 */
export interface EnhancedSessionUser extends TokenUser {
  displayName?: string;
  email?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session creation result
 */
export interface SessionResult {
  success: boolean;
  user?: EnhancedSessionUser;
  tokens?: TokenResult;
  error?: string;
}

/**
 * Session verification result
 */
export interface SessionVerificationResult {
  valid: boolean;
  user?: EnhancedSessionUser;
  needsRefresh?: boolean;
  error?: string;
}

/**
 * Creates a new session with enhanced security
 * 
 * @param user - User data for session creation
 * @param response - NextResponse object for setting cookies
 * @returns Session creation result
 */
export function createEnhancedSession(
  user: EnhancedSessionUser, 
  response: NextResponse
): SessionResult {
  try {
    // Create token pair
    const tokens = createTokenPair(user);
    
    // Set secure cookies
    setSessionCookie(response, tokens.accessToken, 4 * 60 * 60); // 4 hours
    setCsrfCookie(response, tokens.sessionId, 7 * 24 * 60 * 60); // 7 days
    
    // Set refresh token cookie (separate from session cookie)
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    
    logger.info('Enhanced session created', {
      userId: user.id,
      stableId: user.stableId,
      sessionId: tokens.sessionId,
      expiresAt: new Date(tokens.expiresAt * 1000).toISOString(),
    });
    
    return {
      success: true,
      user,
      tokens,
    };
  } catch (error) {
    logger.error('Failed to create enhanced session', error instanceof Error ? error : new Error(String(error)));
    
    return {
      success: false,
      error: 'Failed to create session',
    };
  }
}

/**
 * Verifies current session and returns user data
 * 
 * @param request - Optional NextRequest object
 * @returns Session verification result
 */
export async function verifyEnhancedSession(request?: NextRequest): Promise<SessionVerificationResult> {
  try {
    // Get access token from cookies
    const accessToken = getAccessTokenFromCookies(request);
    if (!accessToken) {
      return {
        valid: false,
        error: 'No access token found',
      };
    }
    
    // Verify access token
    const tokenVerification = verifyAccessToken(accessToken);
    if (!tokenVerification.valid || !tokenVerification.payload) {
      // Try to refresh using refresh token
      return await attemptTokenRefresh(request);
    }
    
    // Check if token needs refresh (signed with old secret)
    if (tokenVerification.needsRefresh) {
      return await attemptTokenRefresh(request);
    }
    
    // Fetch user data from database
    const user = await fetchUserFromDatabase(tokenVerification.payload.stableId);
    if (!user) {
      return {
        valid: false,
        error: 'User not found in database',
      };
    }
    
    return {
      valid: true,
      user,
    };
  } catch (error) {
    logger.error('Session verification error', error instanceof Error ? error : new Error(String(error)));
    
    return {
      valid: false,
      error: 'Session verification failed',
    };
  }
}

/**
 * Attempts to refresh tokens using refresh token
 * 
 * @param request - Optional NextRequest object
 * @returns Session verification result
 */
async function attemptTokenRefresh(request?: NextRequest): Promise<SessionVerificationResult> {
  try {
    // Get refresh token from cookies
    const refreshToken = getRefreshTokenFromCookies(request);
    if (!refreshToken) {
      return {
        valid: false,
        error: 'No refresh token found',
      };
    }
    
    // Verify refresh token
    const refreshVerification = verifyRefreshToken(refreshToken);
    if (!refreshVerification.valid || !refreshVerification.payload) {
      return {
        valid: false,
        error: 'Invalid refresh token',
      };
    }
    
    // Fetch user data
    const user = await fetchUserFromDatabase(refreshVerification.payload.stableId);
    if (!user) {
      return {
        valid: false,
        error: 'User not found in database',
      };
    }
    
    // Create new token pair
    const newTokens = refreshAccessToken(refreshToken, user);
    if (!newTokens) {
      return {
        valid: false,
        error: 'Failed to refresh tokens',
      };
    }
    
    return {
      valid: true,
      user,
      needsRefresh: true, // Indicates tokens were refreshed
    };
  } catch (error) {
    logger.error('Token refresh error', error instanceof Error ? error : new Error(String(error)));
    
    return {
      valid: false,
      error: 'Token refresh failed',
    };
  }
}

/**
 * Clears all session cookies
 * 
 * @param response - NextResponse object for clearing cookies
 */
export function clearEnhancedSession(response: NextResponse): void {
  clearSessionCookie(response);
  clearCsrfCookie(response);
  
  // Clear refresh token cookie
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  
  logger.info('Enhanced session cleared');
}

/**
 * Gets access token from cookies
 * 
 * @param request - Optional NextRequest object
 * @returns Access token string or null
 */
function getAccessTokenFromCookies(request?: NextRequest): string | null {
  if (request) {
    const cookie = request.cookies.get(ACCESS_TOKEN_COOKIE);
    return cookie?.value || null;
  } else {
    const cookieStore = cookies();
    const cookie = cookieStore.get(ACCESS_TOKEN_COOKIE);
    return cookie?.value || null;
  }
}

/**
 * Gets refresh token from cookies
 * 
 * @param request - Optional NextRequest object
 * @returns Refresh token string or null
 */
function getRefreshTokenFromCookies(request?: NextRequest): string | null {
  if (request) {
    const cookie = request.cookies.get(REFRESH_TOKEN_COOKIE);
    return cookie?.value || null;
  } else {
    const cookieStore = cookies();
    const cookie = cookieStore.get(REFRESH_TOKEN_COOKIE);
    return cookie?.value || null;
  }
}

/**
 * Fetches user data from database
 * 
 * @param stableId - User stable ID
 * @returns User data or null
 */
async function fetchUserFromDatabase(stableId: string): Promise<EnhancedSessionUser | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: user, error } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', stableId)
      .single();

    if (error || !user) {
      logger.warn('User not found in database', { stableId, error: error?.message });
      return null;
    }

    return {
      id: user.id,
      stableId: user.stable_id,
      username: user.stable_id,
      tier: user.verification_tier as 'T0' | 'T1' | 'T2' | 'T3',
      displayName: user.display_name,
      email: user.email,
      isActive: user.is_active,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  } catch (error) {
    logger.error('Database fetch error', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Updates session cookies with new tokens
 * 
 * @param response - NextResponse object
 * @param tokens - New token pair
 */
export function updateSessionTokens(response: NextResponse, tokens: TokenResult): void {
  setSessionCookie(response, tokens.accessToken, 4 * 60 * 60); // 4 hours
  
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  logger.info('Session tokens updated', {
    sessionId: tokens.sessionId,
    expiresAt: new Date(tokens.expiresAt * 1000).toISOString(),
  });
}

/**
 * Gets time until current session expires
 * 
 * @param request - Optional NextRequest object
 * @returns Seconds until expiration, or 0 if no valid session
 */
export function getSessionTimeUntilExpiration(request?: NextRequest): number {
  const accessToken = getAccessTokenFromCookies(request);
  if (!accessToken) return 0;
  
  return getTimeUntilExpiration(accessToken);
}

/**
 * Checks if current session is valid
 * 
 * @param request - Optional NextRequest object
 * @returns True if session is valid
 */
export async function isEnhancedSessionValid(request?: NextRequest): Promise<boolean> {
  const verification = await verifyEnhancedSession(request);
  return verification.valid;
}
