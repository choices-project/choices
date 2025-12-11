import type { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { logger } from '@/lib/utils/logger'
import type { Database } from '@/types/supabase'

/**
 * Get Supabase client for use in Next.js middleware
 * 
 * This function creates a Supabase client that works in the middleware context
 * by using a cookie adapter that reads from NextRequest and writes to NextResponse.
 * 
 * @param request - The Next.js request object
 * @param response - The Next.js response object (will be modified with cookie headers)
 * @returns Supabase client configured for middleware use
 * 
 * @example
 * ```typescript
 * export function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   const supabase = getSupabaseMiddlewareClient(request, response)
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ... use user to determine redirect
 *   return response
 * }
 * ```
 */
export async function getSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // In CI/test environments, use fallbacks
    if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
      logger.warn('Supabase environment variables missing in middleware; using test fallbacks', {
        hasUrl: !!url,
        hasKey: !!key,
      })
      // Return a mock client that will always return no user
      // This allows tests to work without real Supabase credentials
      const { createClient } = await import('@supabase/supabase-js')
      return createClient<Database>(
        url ?? 'https://example.supabase.co',
        key ?? 'fake-dev-key-for-ci-only',
      )
    }
    throw new Error('Missing required Supabase environment variables for middleware')
  }

  // Dynamically import @supabase/ssr to avoid build-time errors
  const { createServerClient } = await import('@supabase/ssr')

  // Cookie adapter for middleware context
  // Reads from request.cookies and writes to response.cookies
  const cookieAdapter = {
    get: (name: string) => {
      return request.cookies.get(name)?.value
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      // Write cookie to response headers
      response.cookies.set({
        name,
        value,
        ...(options as {
          path?: string
          domain?: string
          maxAge?: number
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'strict' | 'lax' | 'none'
        }),
      })
    },
    remove: (name: string, options: Record<string, unknown>) => {
      // Delete cookie from response
      response.cookies.delete({
        name,
        ...(options as {
          path?: string
          domain?: string
        }),
      })
    },
  }

  return createServerClient<Database>(url, key, {
    cookies: cookieAdapter,
  })
}

/**
 * Check if a user is authenticated in middleware context
 * 
 * @param request - The Next.js request object
 * @param response - The Next.js response object
 * @returns Object with isAuthenticated boolean and user if authenticated
 */
export async function checkAuthInMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<{ isAuthenticated: boolean; user: { id: string; email?: string | undefined } | null }> {
  try {
    const supabase = await getSupabaseMiddlewareClient(request, response)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { isAuthenticated: false, user: null }
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        ...(user.email ? { email: user.email } : {}),
      },
    }
  } catch (error) {
    // Log error but fail secure (assume unauthenticated)
    logger.error('Error checking authentication in middleware', {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    })
    return { isAuthenticated: false, user: null }
  }
}

