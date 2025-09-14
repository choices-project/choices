import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email: string
  stableId: string
  verificationTier: string
  iat: number
  exp: number
}

export function getAuthToken(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try to get token from cookies
  const authCookie = request.cookies.get('auth-token')
  if (authCookie) {
    return authCookie.value
  }

  return null
}

export function verifyAuthToken(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured')
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    logger.error('JWT verification failed:', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

export function getCurrentUser(request: NextRequest): JWTPayload | null {
  const token = getAuthToken(request)
  if (!token) {
    return null
  }

  return verifyAuthToken(token)
}

export function requireAuth(request: NextRequest): { user: JWTPayload } | { error: Response } {
  const user = getCurrentUser(request)
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return { user }
}
