/**
 * Authentication Middleware Module
 * 
 * Comprehensive middleware for authentication, authorization, and security.
 * Provides middleware functions for API routes and server actions.
 * 
 * Features:
 * - User authentication middleware
 * - Admin authorization middleware
 * - Rate limiting integration
 * - Security logging and monitoring
 * - Error handling and validation
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
import { createRateLimitMiddleware, combineMiddleware } from '@/lib/security/rate-limit';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface MiddlewareContext {
  user?: AuthenticatedUser;
  isAuthenticated: boolean;
  isAdmin: boolean;
  ip?: string;
  userAgent?: string;
}

/**
 * Get authenticated user from request
 */
export async function getUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile with admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_active, created_at')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      isAdmin: profile.is_admin || false,
      isActive: profile.is_active !== false,
      createdAt: profile.created_at || new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting user:', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(limiterName: 'auth' | 'api' | 'contact' | 'pollCreation' | 'voting') {
  return createRateLimitMiddleware(limiterName);
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(req: any, res: any, next: any) => void>) {
  return combineMiddleware(...middlewares);
}

/**
 * Authentication middleware
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<Response>
): Promise<Response> {
  try {
    const user = await getUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!user.isActive) {
      return new Response(
        JSON.stringify({ error: 'Account is inactive' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context: MiddlewareContext = {
      user,
      isAuthenticated: true,
      isAdmin: user.isAdmin,
      ip: request.ip,
      userAgent: request.headers.get('user-agent') || undefined
    };

    return await handler(request, context);
  } catch (error) {
    logger.error('Authentication middleware error:', error instanceof Error ? error : new Error(String(error)));
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Admin authorization middleware
 */
export async function withAdmin(
  request: NextRequest,
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<Response>
): Promise<Response> {
  try {
    const user = await getUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!user.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context: MiddlewareContext = {
      user,
      isAuthenticated: true,
      isAdmin: true,
      ip: request.ip,
      userAgent: request.headers.get('user-agent') || undefined
    };

    return await handler(request, context);
  } catch (error) {
    logger.error('Admin middleware error:', error instanceof Error ? error : new Error(String(error)));
    return new Response(
      JSON.stringify({ error: 'Authorization failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Optional authentication middleware
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<Response>
): Promise<Response> {
  try {
    const user = await getUser(request);
    
    const context: MiddlewareContext = {
      user: user || undefined,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false,
      ip: request.ip,
      userAgent: request.headers.get('user-agent') || undefined
    };

    return await handler(request, context);
  } catch (error) {
    logger.error('Optional auth middleware error:', error instanceof Error ? error : new Error(String(error)));
    return new Response(
      JSON.stringify({ error: 'Request processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Create middleware chain
 */
export function createMiddlewareChain(...middlewares: Array<(req: NextRequest, handler: any) => Promise<Response>>) {
  return async (request: NextRequest, handler: (req: NextRequest, context: MiddlewareContext) => Promise<Response>) => {
    let currentHandler = handler;
    
    // Apply middlewares in reverse order
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const nextHandler = currentHandler;
      currentHandler = (req: NextRequest, context: MiddlewareContext) => middleware(req, nextHandler);
    }
    
    return await currentHandler(request, {} as MiddlewareContext);
  };
}

// Export types and utilities
export { MiddlewareContext, AuthenticatedUser };
export default {
  getUser,
  withAuth,
  withAdmin,
  withOptionalAuth,
  createRateLimitMiddleware,
  combineMiddleware,
  createMiddlewareChain
};