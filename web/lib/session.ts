/**
 * Session Management Library
 * JWT-based authentication for the IA/PO system
 */

import { cookies } from 'next/headers'
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SESSION_COOKIE_NAME = 'choices_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

export interface SessionUser {
  id: string
  stableId: string
  username: string
  displayName?: string
  email?: string
  verificationTier: string
  isActive: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface JWTPayload {
  userId: string
  stableId: string
  username: string
  iat: number
  exp: number
}

/**
 * Create a JWT token for a user
 */
export function createSessionToken(user: SessionUser): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    stableId: user.stableId,
    username: user.username
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE })
}

/**
 * Verify and decode a JWT token
 */
export function verifySessionToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (_error) {
    return null
  }
}

/**
 * Get session token from cookies
 */
export function getSessionToken(request?: NextRequest): string | null {
  if (request) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)
    logger.info('Session debug - reading from request, cookie found:', !!cookie)
    return cookie?.value || null
  } else {
    const cookieStore = cookies()
    const cookie = cookieStore.get(SESSION_COOKIE_NAME)
    logger.info('Session debug - reading from cookieStore, cookie found:', !!cookie)
    return cookie?.value || null
  }
}

/**
 * Set session token in cookies (for server-side usage)
 */
export function setSessionToken(token: string): void {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
    // Don't set domain in development to avoid port conflicts
  })
  logger.info('Session debug - cookie set:', SESSION_COOKIE_NAME)
}

/**
 * Set session token in API response (for API routes)
 */
export function setSessionTokenInResponse(token: string, response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
    // Don't set domain in development to avoid port conflicts
  })
  logger.info('Session debug - cookie set in response:', SESSION_COOKIE_NAME)
  return response
}

/**
 * Clear session token from cookies
 */
export function clearSessionToken(): void {
  const cookieStore = cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Get current user from session
 */
export async function getCurrentUser(request?: NextRequest): Promise<SessionUser | null> {
  const token = getSessionToken(request)
  logger.info('Session debug - token found:', !!token)
  if (!token) {
    logger.info('Session debug - no token found')
    return null
  }

  const payload = verifySessionToken(token)
  logger.info('Session debug - payload valid:', !!payload)
  if (!payload) {
    logger.info('Session debug - invalid token')
    return null
  }

  // Fetch user from database
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: user, error } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', payload.stableId)
      .single()

    if (error || !user) {
      logger.info('Session debug - user not found in database:', error?.message)
      return null
    }

    logger.info('Session debug - user found:', user.stable_id)
    return {
      id: user.id,
      stableId: user.stable_id,
      username: user.stable_id,
      email: user.email,
      verificationTier: user.verification_tier,
      isActive: user.is_active,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  } catch (error) {
    logger.error('Error fetching user from database:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request)
  return user !== null
}
