/**
 * Centralized Session Cookie Management
 * Implements __Host-session pattern for enhanced security
 * 
 * Security Features:
 * - __Host- prefix for domain binding
 * - Secure, HttpOnly, SameSite=Lax
 * - Automatic rotation on privilege changes
 * - Proper expiration handling
 */

import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { withOptional } from '@/lib/util/objects'

export type SessionPayload = {
  sub: string // user ID
  iat: number // issued at
  exp: number // expiration
  role?: string // user role
  stableId?: string // stable user identifier
}

export type SessionOptions = {
  maxAge?: number // seconds
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

const DEFAULT_SESSION_OPTIONS: Required<SessionOptions> = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: true,
  sameSite: 'lax'
}

/**
 * Generate a new JWT token for session
 */
export function generateSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload: SessionPayload = Object.assign({}, payload, {
    iat: now,
    exp: now + DEFAULT_SESSION_OPTIONS.maxAge
  })

  return jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: DEFAULT_SESSION_OPTIONS.maxAge
  })
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256']
    }) as SessionPayload

    // Additional validation
    if (!decoded.sub || !decoded.iat || !decoded.exp) {
      logger.warn('Invalid session token structure', { token: token.substring(0, 20) + '...' })
      return null
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp < now) {
      logger.info('Session token expired', { userId: decoded.sub })
      return null
    }

    return decoded
  } catch (error) {
    logger.warn('Session token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

/**
 * Set session cookie with proper security headers
 */
export function setSessionCookie(token: string, options: SessionOptions = {}): void {
  const cookieOptions = Object.assign({}, DEFAULT_SESSION_OPTIONS, options)
  
  cookies().set({
    name: '__Host-session',
    value: token,
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: '/',
    maxAge: cookieOptions.maxAge,
    // __Host- prefix requires these settings:
    // - Secure flag (handled above)
    // - No Domain attribute (handled by not specifying domain)
    // - Path=/ (handled above)
  })

  logger.info('Session cookie set', { 
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge
  })
}

/**
 * Get current session token from cookie
 */
export function getSessionToken(): string | null {
  const sessionCookie = cookies().get('__Host-session')
  return sessionCookie?.value || null
}

/**
 * Get current session payload
 */
export function getCurrentSession(): SessionPayload | null {
  const token = getSessionToken()
  if (!token) return null
  
  return verifySessionToken(token)
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): void {
  cookies().delete('__Host-session')
  logger.info('Session cookie cleared')
}

/**
 * Rotate session token (for security events)
 */
export function rotateSessionToken(userId: string, role?: string, stableId?: string): string {
  const newToken = generateSessionToken(withOptional({
    sub: userId
  }, {
    role,
    stableId
  }))

  setSessionCookie(newToken)
  
  logger.info('Session token rotated', { 
    userId,
    role,
    hasStableId: !!stableId
  })

  return newToken
}

/**
 * Validate session and return user info
 */
export function validateSession(): { userId: string; role?: string; stableId?: string } | null {
  const session = getCurrentSession()
  if (!session) return null

  return withOptional({
    userId: session.sub
  }, {
    role: session.role,
    stableId: session.stableId
  })
}

/**
 * Check if session is about to expire (within 1 hour)
 */
export function isSessionExpiringSoon(): boolean {
  const session = getCurrentSession()
  if (!session) return false

  const now = Math.floor(Date.now() / 1000)
  const oneHour = 60 * 60
  
  return (session.exp - now) < oneHour
}

/**
 * Refresh session if expiring soon
 */
export function refreshSessionIfNeeded(userId: string, role?: string, stableId?: string): boolean {
  if (isSessionExpiringSoon()) {
    rotateSessionToken(userId, role, stableId)
    return true
  }
  return false
}
