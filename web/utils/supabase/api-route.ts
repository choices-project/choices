/**
 * Supabase client factory for API routes
 *
 * This factory creates a Supabase client that properly handles cookies in API routes
 * using NextResponse instead of next/headers (which doesn't work in API routes).
 */

import { getValidatedEnv } from '@/lib/config/env'
import { logger } from '@/lib/utils/logger'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'

// Runtime guard to prevent client-side usage
const assertRunningOnServer = (fnName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error(`${fnName} must be called on the server`)
  }
}

/**
 * Create a Supabase client for API routes with proper cookie handling
 *
 * This function creates a Supabase client that uses NextResponse for cookie management,
 * which is required for API routes (next/headers doesn't work in API routes).
 *
 * @param request - The Next.js request object
 * @param response - The Next.js response object (will be modified with cookies)
 * @returns Supabase client configured for API routes
 */
export async function getSupabaseApiRouteClient(
  request: NextRequest,
  response: NextResponse
): Promise<SupabaseClient<Database>> {
  assertRunningOnServer('getSupabaseApiRouteClient')
  const cfg = getValidatedEnv()

  const { createServerClient } = await import('@supabase/ssr')

  const url = cfg.NEXT_PUBLIC_SUPABASE_URL
  const key = cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables')
  }

  // Create cookie adapter that uses NextResponse for API routes
  const cookieAdapter = {
    get: (name: string) => {
      const cookie = request.cookies.get(name)
      return cookie?.value
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      try {
        // Determine production status
        const isProduction = process.env.NODE_ENV === 'production'
        const requireSecure = isProduction

        // Extract cookie options with secure defaults
        // For auth cookies, always use secure defaults if not explicitly provided
        const isAuthCookie = name.includes('auth') || name.includes('session') || name.startsWith('sb-')
        
        const cookieOptions: {
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'strict' | 'lax' | 'none'
          path?: string
          maxAge?: number
        } = {
          // For auth cookies, FORCE secure values regardless of what Supabase SSR passes
          // This ensures cookies are always set with proper security attributes
          sameSite: (typeof options.sameSite === 'string' ? options.sameSite : 'lax') as 'strict' | 'lax' | 'none',
          path: typeof options.path === 'string' ? options.path : '/',
        }

        const httpOnly =
          isAuthCookie ? true : (typeof options.httpOnly === 'boolean' ? options.httpOnly : undefined)
        const secure =
          isAuthCookie ? requireSecure : (typeof options.secure === 'boolean' ? options.secure : undefined)

        if (typeof httpOnly === 'boolean') {
          cookieOptions.httpOnly = httpOnly
        }

        if (typeof secure === 'boolean') {
          cookieOptions.secure = secure
        }

        if (typeof options.maxAge === 'number') {
          cookieOptions.maxAge = options.maxAge
        }

        // Set cookie on NextResponse (this works in API routes)
        // IMPORTANT: Do NOT set domain attribute - let browser handle domain scoping
        // This ensures cookies work correctly with middleware
        response.cookies.set(name, value, cookieOptions)
        
        // Log cookie setting for debugging (always log for auth cookies)
        if (isAuthCookie) {
          logger.info('Setting auth cookie in API route (cookie adapter)', {
            name,
            valueLength: value.length,
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            path: cookieOptions.path,
            isProduction,
            requireSecure,
            optionsReceived: {
              httpOnly: typeof options.httpOnly === 'boolean' ? options.httpOnly : 'not provided',
              secure: typeof options.secure === 'boolean' ? options.secure : 'not provided',
            },
          })
        }
      } catch (error) {
        logger.warn('Failed to set cookie in API route', { name, error })
      }
    },
    remove: (name: string, options: Record<string, unknown>) => {
      try {
        const cookieOptions: {
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'strict' | 'lax' | 'none'
          path?: string
          maxAge?: number
        } = {
          maxAge: 0, // Expire immediately
        }

        if (typeof options.path === 'string') {
          cookieOptions.path = options.path
        }

        // Remove cookie by setting maxAge to 0
        response.cookies.set(name, '', cookieOptions)
      } catch (error) {
        logger.warn('Failed to remove cookie in API route', { name, error })
      }
    },
  }

  // Create Supabase client with API route cookie adapter
  return createServerClient<Database>(url, key, {
    cookies: cookieAdapter,
  })
}

