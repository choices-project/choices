/**
 * WebAuthn Session Management
 * 
 * Handles WebAuthn-specific session creation and management.
 * Integrates with the existing session management system while
 * providing WebAuthn-specific functionality.
 */

import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { generateSessionToken } from '@/lib/core/auth/session-cookies';

export interface WebAuthnSessionData {
  userId: string;
  username: string;
  credentialId: string;
  authenticatedAt: string;
  method: 'webauthn';
  trustTier?: 'T1' | 'T2' | 'T3';
  isAdmin?: boolean;
}

export interface WebAuthnSessionOptions {
  maxAge?: number; // seconds
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Create a WebAuthn session token
 */
export function createWebAuthnSessionToken(sessionData: Omit<WebAuthnSessionData, 'authenticatedAt'>): string {
  const fullSessionData: WebAuthnSessionData = {
    ...sessionData,
    authenticatedAt: new Date().toISOString()
  };

  // Generate a secure session token
  const token = generateSessionToken({
    sub: fullSessionData.userId,
    role: fullSessionData.trustTier || 'T1',
    stableId: fullSessionData.userId
  });

  devLog('WebAuthn session token created', {
    userId: sessionData.userId,
    credentialId: sessionData.credentialId.substring(0, 8) + '...',
    trustTier: sessionData.trustTier
  });

  return token;
}

/**
 * Set WebAuthn session cookie with proper security headers
 */
export function setWebAuthnSessionCookie(
  response: NextResponse,
  sessionData: WebAuthnSessionData,
  options: WebAuthnSessionOptions = {}
): void {
  const token = createWebAuthnSessionToken(sessionData);
  
  const cookieOptions = {
    maxAge: options.maxAge || 7 * 24 * 60 * 60, // 7 days default
    secure: options.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options.sameSite || 'lax' as const
  };

  // Set the session cookie with proper security headers
  response.cookies.set('__Host-choices-session', token, {
    httpOnly: true,
    secure: cookieOptions.secure,
    path: '/',
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge
  });

  devLog('WebAuthn session cookie set', {
    userId: sessionData.userId,
    secure: cookieOptions.secure,
    maxAge: cookieOptions.maxAge
  });
}

/**
 * Create a successful WebAuthn authentication response
 */
export function createWebAuthnAuthResponse(
  sessionData: WebAuthnSessionData,
  options: WebAuthnSessionOptions = {}
): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'WebAuthn authentication successful',
    user: {
      id: sessionData.userId,
      username: sessionData.username,
      trustTier: sessionData.trustTier,
      isAdmin: sessionData.isAdmin
    },
    session: {
      method: 'webauthn',
      authenticatedAt: sessionData.authenticatedAt
    }
  });

  // Set the session cookie
  setWebAuthnSessionCookie(response, sessionData, options);

  return response;
}

/**
 * Create a successful WebAuthn registration response
 */
export function createWebAuthnRegistrationResponse(
  userId: string,
  username: string,
  credentialId: string,
  options: WebAuthnSessionOptions = {}
): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'WebAuthn credential registered successfully',
    credential: {
      id: credentialId,
      registeredAt: new Date().toISOString()
    },
    user: {
      id: userId,
      username: username
    }
  });

  // Apply session options if provided
  if (options.maxAge) {
    response.cookies.set('session', '', {
      maxAge: options.maxAge,
      secure: options.secure ?? true,
      sameSite: options.sameSite ?? 'strict',
      httpOnly: true,
      path: '/'
    });
  }

  devLog('WebAuthn registration successful', {
    userId,
    username,
    credentialId: credentialId.substring(0, 8) + '...'
  });

  return response;
}

/**
 * Validate WebAuthn session data
 */
export function validateWebAuthnSession(sessionData: unknown): sessionData is WebAuthnSessionData {
  return (
    sessionData !== null &&
    typeof sessionData === 'object' &&
    'userId' in sessionData &&
    'username' in sessionData &&
    'credentialId' in sessionData &&
    'authenticatedAt' in sessionData &&
    'method' in sessionData &&
    typeof (sessionData as any).userId === 'string' &&
    typeof (sessionData as any).username === 'string' &&
    typeof (sessionData as any).credentialId === 'string' &&
    typeof (sessionData as any).authenticatedAt === 'string' &&
    (sessionData as any).method === 'webauthn'
  );
}

/**
 * Extract WebAuthn session from request
 */
export function getWebAuthnSession(request: Request): WebAuthnSessionData | null {
  try {
    // Extract session token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let sessionToken: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    } else if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      sessionToken = cookies.session || null;
    }
    
    if (!sessionToken) {
      return null;
    }
    
    // This would typically decode and validate the session token
    // For now, return null as this is handled by the main session system
    devLog('WebAuthn session token found in request');
    return null;
  } catch (error) {
    devLog('Error extracting WebAuthn session:', error);
    return null;
  }
}

/**
 * Clear WebAuthn session
 */
export function clearWebAuthnSession(response: NextResponse): void {
  response.cookies.set('__Host-choices-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 0 // Expire immediately
  });

  devLog('WebAuthn session cleared');
}
