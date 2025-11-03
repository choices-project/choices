/**
 * Core Authentication Middleware
 * 
 * Enhanced authentication middleware with security features:
 * - Origin validation
 * - Rate limiting integration
 * - Turnstile verification
 * - Comprehensive error handling
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { requireTrustedOrigin } from '@/lib/http/origin';
import { devLog } from '@/lib/logger';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { requireTurnstileVerification } from '@/lib/security/turnstile';
import { withOptional } from '@/lib/util/objects';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export type TrustTier = 'T1' | 'T2' | 'T3';

export type AuthUser = {
  id: string;
  email: string;
  trust_tier: TrustTier;
  username?: string | null;
}

export type AuthContext = {
  user: AuthUser;
  supabase: SupabaseClient;
}

export type UserProfile = {
  trust_tier: TrustTier;
  username?: string;
}

export type AuthMiddlewareOptions = {
  requireAuth?: boolean;
  requireTrustTier?: TrustTier;
  requireAdmin?: boolean;
  allowPublic?: boolean;
  requireOrigin?: boolean;
  requireTurnstile?: boolean;
  turnstileAction?: string;
  rateLimit?: 'auth' | 'registration' | 'deviceFlow' | 'biometric';
}

/**
 * Enhanced authentication middleware factory
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    requireAuth = true,
    requireTrustTier,
    requireAdmin = false,
    allowPublic = false,
    requireOrigin = true,
    requireTurnstile = false,
    turnstileAction,
    rateLimit = 'auth'
  } = options;

  return async (request: NextRequest, context?: AuthContext): Promise<NextResponse | null> => {
    try {
      // Origin validation
      if (requireOrigin) {
        try {
          requireTrustedOrigin(request);
        } catch (error) {
          devLog('Origin validation failed:', error);
          return NextResponse.json(
            { message: 'Invalid origin' },
            { status: 403 }
          );
        }
      }

      // Use context if provided for enhanced authentication
      if (context?.user && !allowPublic) {
        devLog('Using provided authentication context', {
          userId: context.user.id,
          trustTier: context.user.trust_tier
        });
      }

      // Rate limiting
      if (rateLimit) {
        // Rate limit configuration based on type
        const rateLimitConfigs: Record<string, { maxRequests: number; windowMs: number }> = {
          auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
          registration: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 requests per hour
          deviceFlow: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
          biometric: { maxRequests: 20, windowMs: 15 * 60 * 1000 } // 20 requests per 15 minutes
        };
        
        const config = rateLimitConfigs[rateLimit] || rateLimitConfigs.auth;
        const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
        const ua = request.headers.get('user-agent') ?? undefined;
        const rateLimitResult = await apiRateLimiter.checkLimit(ip, `/auth:${rateLimit}`, {
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          userAgent: ua
        });
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              message: 'Too many requests. Please try again later.',
              retryAfter: rateLimitResult.retryAfter
            },
            { status: 429 }
          );
        }
      }

      // Turnstile verification
      if (requireTurnstile) {
        try {
          await requireTurnstileVerification(request, turnstileAction);
        } catch (error) {
          devLog('Turnstile verification failed:', error);
          return NextResponse.json(
            { message: 'Security verification failed' },
            { status: 403 }
          );
        }
      }

      // Create Supabase client at runtime
      const supabase = await getSupabaseServerClient();

      if (!supabase) {
        return NextResponse.json(
          { message: 'Authentication service not available' },
          { status: 500 }
        );
      }

      // Get current user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Handle unauthenticated requests
      if (authError || !user) {
        if (requireAuth) {
          return NextResponse.json(
            { message: 'Authentication required' },
            { status: 401 }
          );
        }
        
        if (allowPublic) {
          // Allow public access but return null user
          return null;
        }
        
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('trust_tier, username')
        .eq('user_id', String(user.id))
        .single();

      if (profileError) {
        devLog('Profile lookup error', profileError, { userId: user.id });
        return NextResponse.json(
          { message: 'User profile not found' },
          { status: 404 }
        );
      }

      const authUser: AuthUser = withOptional({
        id: user.id,
        email: user.email ?? '',
        trust_tier: profile && !('error' in profile) ? (profile as UserProfile).trust_tier ?? 'T1' : 'T1'
      }, {
        username: profile && !('error' in profile) ? (profile as UserProfile).username : null
      });

      // Check admin requirement - rely on RLS policies for security
      if (requireAdmin) {
        const { data: adminCheck, error: adminError } = await supabase
          .rpc('is_admin', { user_id: user.id });

        if (adminError || !adminCheck) {
          return NextResponse.json(
            { message: 'Admin access required - insufficient privileges' },
            { status: 403 }
          );
        }
      }

      // Check trust tier requirement
      if (requireTrustTier) {
        const tierHierarchy: Record<TrustTier, number> = {
          'T1': 1,
          'T2': 2,
          'T3': 3
        };

        const userTier = tierHierarchy[authUser.trust_tier] || 0;
        const requiredTier = tierHierarchy[requireTrustTier];

        if (userTier < requiredTier) {
          return NextResponse.json(
            { message: `Trust tier ${requireTrustTier} required` },
            { status: 403 }
          );
        }
      }

      // Return null to continue processing (authentication successful)
      return null;

    } catch (error) {
      devLog('Auth middleware error', error instanceof Error ? error : new Error(String(error)));

      return NextResponse.json(
        { message: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authMiddleware = createAuthMiddleware(options);
    const authResult = await authMiddleware(request);

    if (authResult) {
      return authResult;
    }

    // Get user context for the handler at runtime
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      );
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use RLS function to check admin status
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { user_id: user!.id });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', String(user!.id))
      .single();

    const context: AuthContext = {
      user: withOptional({
        id: user!.id,
        email: user!.email || '',
        trust_tier: isAdmin ? 'T3' : 'T1'
      }, {
        username: profile && !('error' in profile) ? (profile as UserProfile).username : null
      }),
      supabase
    };

    // Log successful authentication
    devLog('Auth middleware: Processing request for user:', {
      userId: context.user.id,
      trustTier: context.user.trust_tier,
      method: request.method,
      path: request.nextUrl.pathname
    });
    
    return handler(request, context);
  };
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: NextRequest) => string;
}) {
  const { maxRequests, windowMs, keyGenerator } = options;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator ? keyGenerator(request) : 'default';
    
    // Use Upstash-backed limiter via facade
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const ua = request.headers.get('user-agent') ?? undefined;
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, `/middleware:${key}`, { maxRequests, windowMs, userAgent: ua });
    
    // Log rate limit configuration for debugging
    devLog('Rate limit check', {
      key: key.substring(0, 8) + '...',
      maxRequests,
      windowMs,
      allowed: rateLimitResult.allowed
    });
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          limit: maxRequests,
          window: windowMs
        },
        { status: 429 }
      );
    }

    return null;
  };
}

/**
 * Security headers middleware
 */
export function createSecurityHeadersMiddleware() {
  return (response: NextResponse): NextResponse => {
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Vary', 'Cookie, Authorization');

    return response;
  };
}

/**
 * Combined middleware for API routes
 */
export function createApiMiddleware(options: AuthMiddlewareOptions = {}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Apply authentication middleware
    const authMiddleware = createAuthMiddleware(options);
    const authResult = await authMiddleware(request);

    if (authResult) {
      return authResult;
    }

    // Apply security headers
    const response = new NextResponse();
    return createSecurityHeadersMiddleware()(response);
  };
}

/**
 * Combine multiple middleware functions into a single middleware
 */
export function combineMiddleware(...middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>>) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

/**
 * Simple getUser function for backward compatibility
 * Uses canonical Supabase client
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      devLog('getUser error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    devLog('getUser error:', error);
    return null;
  }
}

/**
 * requireUser function for backward compatibility
 * Uses canonical Supabase client
 */
export async function requireUser(_req: Request): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}