/**
 * Authentication Utilities
 * 
 * Production authentication utilities for the Choices platform
 * 
 * Created: January 16, 2025
 * Status: ✅ ACTIVE
 */

import { logger } from './logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Define proper types for request/response
type Request = {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  url: string;
}

type Response = {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
}

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

export type AuthResult = {
  user: User | null;
  error: string | null;
}

export type SessionValidation = {
  valid: boolean;
  user?: User;
  error?: string;
}

/**
 * Get current user from session
 */
export function getUser(): Promise<AuthResult> {
  try {
    logger.info('Getting current user');
    return (async () => {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        return { user: null, error: 'Auth client unavailable' };
      }
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        return { user: null, error: error.message ?? 'Failed to get user' };
      }
      const u = data?.user;
      if (!u) {
        return { user: null, error: null };
      }
      const user: User = {
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.name as string | undefined) ?? '',
        avatar: (u.user_metadata?.avatar_url as string | undefined),
        role: (u.app_metadata?.role as string | undefined)
      };
      return { user, error: null };
    })();
  } catch (error) {
    logger.error('Failed to get user', error instanceof Error ? error : new Error(String(error)));
    return Promise.resolve({
      user: null,
      error: 'Failed to get user'
    });
  }
}

/**
 * Require authentication middleware
 */
export function requireAuth(handler: (req: Request, res: Response) => Promise<Response>) {
  return async (req: Request, res: Response) => {
    try {
      const { user, error } = await getUser();
      
      if (!user || error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      return handler(req, res);
    } catch (error) {
      logger.error('Authentication error', error instanceof Error ? error : new Error(String(error)));
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Check user permissions
 */
export function checkPermissions(userId: string, permission: string): Promise<boolean> {
  try {
    // This would integrate with your actual permission system
    logger.info('Checking permissions', { userId, permission });
    return Promise.resolve(true); // Placeholder
  } catch (error) {
    logger.error('Permission check failed', error instanceof Error ? error : new Error(String(error)));
    return Promise.resolve(false);
  }
}

/**
 * Validate user session
 */
export function validateSession(sessionToken: string): Promise<SessionValidation> {
  try {
    logger.info('Validating session', { sessionTokenPresent: Boolean(sessionToken) });
    return (async () => {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        return { valid: false, error: 'Auth client unavailable' };
      }
      // Rely on Supabase cookie/session; token param is ignored in server context
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        return { valid: false, error: error.message ?? 'Session invalid' };
      }
      const u = data?.user;
      if (!u) {
        return { valid: false, error: 'No active session' };
      }
      const user: User = {
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.name as string | undefined) ?? '',
        avatar: (u.user_metadata?.avatar_url as string | undefined),
        role: (u.app_metadata?.role as string | undefined)
      };
      return { valid: true, user };
    })();
  } catch (error) {
    logger.error('Session validation failed', error instanceof Error ? error : new Error(String(error)));
    return Promise.resolve({
      valid: false,
      error: 'Session validation failed'
    });
  }
}