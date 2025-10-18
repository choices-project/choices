/**
 * Require User Helper
 * 
 * Server-side authentication helper for API routes and server actions.
 * Provides consistent user authentication with proper error handling.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

import { validateOrigin } from '@/lib/http/origin';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export interface User {
  id: string;
  email: string;
  trust_tier: 'T1' | 'T2' | 'T3';
  username?: string;
  is_admin?: boolean;
}

export interface UserProfile {
  trust_tier: 'T1' | 'T2' | 'T3';
  username?: string;
}

export interface RequireUserOptions {
  requireOrigin?: boolean;
  allowPublic?: boolean;
  requireAdmin?: boolean;
  requireTrustTier?: 'T1' | 'T2' | 'T3';
}

export interface RequireUserResult {
  user: User;
  supabase: SupabaseClient;
}

export interface RequireUserError {
  error: string;
  status: number;
}

/**
 * Require authenticated user for API routes
 */
export async function requireUser(
  request: NextRequest,
  options: RequireUserOptions = {}
): Promise<RequireUserResult | RequireUserError> {
  const {
    requireOrigin = true,
    allowPublic = false,
    requireAdmin = false,
    requireTrustTier
  } = options;

  try {
    // Origin validation
    if (requireOrigin) {
      const originValidation = validateOrigin(request);
      if (!originValidation.valid) {
        devLog('Origin validation failed:', {
          reason: originValidation.reason,
          origin: originValidation.origin,
          path: request.nextUrl.pathname
        });
        
        return {
          error: 'Invalid origin',
          status: 403
        };
      }
    }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return {
        error: 'Authentication service not available',
        status: 500
      };
    }

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (allowPublic) {
        // Return a public user object
        return {
          user: {
            id: 'public',
            email: '',
            trust_tier: 'T1',
            is_admin: false
          },
          supabase
        };
      }

      return {
        error: 'Authentication required',
        status: 401
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', String(user.id))
      .single();

    if (profileError) {
      devLog('Profile lookup error:', { error: profileError.message, userId: user.id });
      return {
        error: 'User profile not found',
        status: 404
      };
    }

    // Check admin status
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin', { input_user_id: user.id });

    if (adminError) {
      devLog('Admin check error:', { error: adminError.message, userId: user.id });
    }

    const userProfile = profile && !('error' in profile) ? profile as UserProfile : null;
    const userObj: User = {
      id: user.id,
      email: user.email || '',
      trust_tier: userProfile?.trust_tier || 'T1',
      is_admin: !!isAdmin,
      username: userProfile?.username
    };

    // Check admin requirement
    if (requireAdmin && !userObj.is_admin) {
      return {
        error: 'Admin access required',
        status: 403
      };
    }

    // Check trust tier requirement
    if (requireTrustTier) {
      const tierHierarchy: Record<string, number> = {
        'T1': 1,
        'T2': 2,
        'T3': 3
      };

      const userTier = tierHierarchy[userObj.trust_tier] || 0;
      const requiredTier = tierHierarchy[requireTrustTier];

      if (userTier < (requiredTier || 0)) {
        return {
          error: `Trust tier ${requireTrustTier} required`,
          status: 403
        };
      }
    }

    // Log successful authentication
    devLog('User authenticated:', {
      userId: userObj.id,
      trustTier: userObj.trust_tier,
      isAdmin: userObj.is_admin,
      path: request.nextUrl.pathname
    });

    return {
      user: userObj,
      supabase
    };

  } catch (error) {
    devLog('Require user error:', { error: error instanceof Error ? error.message : String(error) });
    return {
      error: 'Authentication error',
      status: 500
    };
  }
}

/**
 * Require user for server actions
 */
export async function requireUserForAction(
  options: RequireUserOptions = {}
): Promise<RequireUserResult | RequireUserError> {
  // For server actions, we need to get the request from headers
  // This is a simplified version - in practice, you'd need to pass the request
  const supabase = await getSupabaseServerClient();
  
  if (!supabase) {
    return {
      error: 'Authentication service not available',
      status: 500
    };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    if (options.allowPublic) {
      return {
        user: {
          id: 'public',
          email: '',
          trust_tier: 'T1',
          is_admin: false
        },
        supabase
      };
    }

    return {
      error: 'Authentication required',
      status: 401
    };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('trust_tier, username')
    .eq('user_id', String(user.id))
    .single();

  if (profileError) {
    return {
      error: 'User profile not found',
      status: 404
    };
  }

  // Check admin status
  const { data: isAdmin } = await supabase
    .rpc('is_admin', { input_user_id: user.id });

  const userProfile = profile && !('error' in profile) ? profile as UserProfile : null;
  const userObj: User = {
    id: user.id,
    email: user.email || '',
    trust_tier: userProfile?.trust_tier || 'T1',
    is_admin: !!isAdmin,
    username: userProfile?.username
  };

  // Apply requirements
  if (options.requireAdmin && !userObj.is_admin) {
    return {
      error: 'Admin access required',
      status: 403
    };
  }

  if (options.requireTrustTier) {
    const tierHierarchy: Record<string, number> = {
      'T1': 1,
      'T2': 2,
      'T3': 3
    };

    const userTier = tierHierarchy[userObj.trust_tier] || 0;
    const requiredTier = tierHierarchy[options.requireTrustTier];

    if (userTier < (requiredTier || 0)) {
      return {
        error: `Trust tier ${options.requireTrustTier} required`,
        status: 403
      };
    }
  }

  return {
    user: userObj,
    supabase
  };
}

/**
 * Get current user without throwing errors
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', String(user.id))
      .single();

    if (profileError) return null;

    // Check admin status
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { input_user_id: user.id });

    const userProfile = profile && !('error' in profile) ? profile as UserProfile : null;
    
    return {
      id: user.id,
      email: user.email || '',
      trust_tier: userProfile?.trust_tier || 'T1',
      is_admin: !!isAdmin,
      username: userProfile?.username
    };

  } catch (error) {
    devLog('Get current user error:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Check if user has required permissions
 */
export function hasPermission(
  user: User,
  permission: 'admin' | 'moderator' | 'user'
): boolean {
  switch (permission) {
    case 'admin':
      return user.is_admin || user.trust_tier === 'T3';
    case 'moderator':
      return user.is_admin || user.trust_tier === 'T2' || user.trust_tier === 'T3';
    case 'user':
      return true;
    default:
      return false;
  }
}

/**
 * Check if user can access resource
 */
export function canAccessResource(
  user: User,
  resourceOwnerId: string,
  requireOwnership = true
): boolean {
  if (!requireOwnership) return true;
  return user.id === resourceOwnerId || !!user.is_admin;
}

/**
 * Create error response for authentication failures
 */
export function createAuthErrorResponse(
  error: string,
  status = 401
): Response {
  return new Response(
    JSON.stringify({ error }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
