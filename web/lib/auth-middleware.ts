import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { logger } from './logger'
import { devLog } from './logger'

export interface AuthUser {
  id: string
  email: string
  trust_tier: string
  username?: string
}

export interface AuthContext {
  user: AuthUser
  supabase: any
}



export type AuthMiddleware = (
  request: NextRequest,
  context?: AuthContext
) => Promise<NextResponse | null>

export type TrustTier = 'T1' | 'T2' | 'T3'

/**
 * Authentication middleware factory
 */
export function createAuthMiddleware(options: {
  requireAuth?: boolean
  requireTrustTier?: TrustTier
  requireAdmin?: boolean
  allowPublic?: boolean
} = {}) {
  const {
    requireAuth = true,
    requireTrustTier,
    requireAdmin = false,
    allowPublic = false
  } = options

  return async (_request: NextRequest, _context?: AuthContext): Promise<NextResponse | null> => {
    try {
      // Create Supabase client
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)

      if (!supabase) {
        return NextResponse.json(
          { message: 'Authentication service not available' },
          { status: 500 }
        )
      }

      // Get current user session
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      // Handle unauthenticated requests
      if (authError || !user) {
        if (requireAuth) {
          return NextResponse.json(
            { message: 'Authentication required' },
            { status: 401 }
          )
        }
        
        if (allowPublic) {
          // Allow public access but return null user
          return null
        }
        
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('trust_tier, username')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        logger.error('Profile lookup error', profileError, { userId: user.id })
        return NextResponse.json(
          { message: 'User profile not found' },
          { status: 404 }
        )
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        trust_tier: profile?.trust_tier || 'T1',
        username: profile?.username
      }

      // Check admin requirement
      if (requireAdmin && authUser.trust_tier !== 'T3') {
        return NextResponse.json(
          { message: 'Admin access required' },
          { status: 403 }
        )
      }

      // Check trust tier requirement
      if (requireTrustTier) {
        const tierHierarchy: Record<TrustTier, number> = {
          'T1': 1,
          'T2': 2,
          'T3': 3
        }

        const userTier = tierHierarchy[authUser.trust_tier as TrustTier] || 0
        const requiredTier = tierHierarchy[requireTrustTier]

        if (userTier < requiredTier) {
          return NextResponse.json(
            { message: `Trust tier ${requireTrustTier} required` },
            { status: 403 }
          )
        }
      }

      // Return null to continue processing (authentication successful)
      return null

    } catch (error) {
      logger.error('Auth middleware error', error instanceof Error ? error : new Error(String(error)))
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireTrustTier?: TrustTier
    requireAdmin?: boolean
    allowPublic?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authMiddleware = createAuthMiddleware(options)
    const authResult = await authMiddleware(request)

    if (authResult) {
      return authResult
    }

    // Get user context for the handler
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', user!.id)
      .single()

    const context: AuthContext = {
      user: {
        id: user!.id,
        email: user!.email || '',
        trust_tier: profile?.trust_tier || 'T1',
        username: profile?.username
      },
      supabase
    }

    // Use the request and context parameters to provide detailed information to the handler
    devLog('Auth middleware: Processing request for user:', context.user.id, 'with trust tier:', context.user.trust_tier, 'method:', request.method, 'path:', request.nextUrl.pathname);
    
    return handler(request, context)
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options: {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
}) {
  const { maxRequests, windowMs, keyGenerator } = options

  // Simple in-memory store (should be replaced with Redis in production)
  const store = new Map<string, { count: number; resetTime: number }>()

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator 
      ? keyGenerator(request)
      : request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    const now = Date.now()
    const windowKey = `${key}:${Math.floor(now / windowMs)}`
    
    const current = store.get(windowKey)
    
    if (!current || now > current.resetTime) {
      store.set(windowKey, {
        count: 1,
        resetTime: now + windowMs
      })
    } else if (current.count >= maxRequests) {
      devLog('Rate limit exceeded for:', key, 'requests:', current.count, 'limit:', maxRequests);
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    } else {
      current.count++
      store.set(windowKey, current)
    }

    return null
  }
}

/**
 * CORS middleware
 */
export function createCorsMiddleware(options: {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
} = {}) {
  const {
    allowedOrigins = ['http://localhost:3000', 'https://choices-platform.vercel.app'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization']
  } = options

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const origin = request.headers.get('origin')
    
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { message: 'CORS not allowed' },
        { status: 403 }
      )
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': '86400'
        }
      })
    }

    return null
  }
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: ((request: NextRequest) => Promise<NextResponse | null>)[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request)
      if (result) {
        return result
      }
    }
    return null
  }
}

/**
 * Utility function to get user from request
 */
export async function getUserFromRequest(_request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      trust_tier: profile?.trust_tier || 'T1',
      username: profile?.username
    }
  } catch (error) {
    logger.error('Error getting user from request', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}
