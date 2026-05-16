/**
 * Supabase client factory for API routes
 *
 * This factory creates a Supabase client that properly handles cookies in API routes
 * using NextResponse instead of next/headers (which doesn't work in API routes).
 */

import { productionAuthCookieOptions } from '@/lib/auth/production-auth-cookies'
import { sanitizeAuthCookiesForRoute } from '@/lib/auth/request-auth-cookies'
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

function applyAuthCookieOptions(
  name: string,
  value: string,
  options: Record<string, unknown>,
  response: NextResponse,
  requestHostname: string,
): void {
  const isAuthCookie =
    name.includes('auth') || name.includes('session') || name.startsWith('sb-')
  const prodAuth = productionAuthCookieOptions(requestHostname)

  const cookieOptions: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    path?: string
    maxAge?: number
    domain?: string
  } = {
    sameSite: (typeof options.sameSite === 'string' ? options.sameSite : 'lax') as
      | 'strict'
      | 'lax'
      | 'none',
    path: typeof options.path === 'string' ? options.path : '/',
  }

  if (isAuthCookie) {
    cookieOptions.httpOnly = prodAuth.httpOnly
    cookieOptions.secure = prodAuth.secure
    if (prodAuth.domain) {
      cookieOptions.domain = prodAuth.domain
    }
  } else {
    if (typeof options.httpOnly === 'boolean') {
      cookieOptions.httpOnly = options.httpOnly
    }
    if (typeof options.secure === 'boolean') {
      cookieOptions.secure = options.secure
    }
  }

  if (typeof options.maxAge === 'number') {
    cookieOptions.maxAge = options.maxAge
  }

  response.cookies.set(name, value, cookieOptions)

  if (isAuthCookie) {
    logger.info('Setting auth cookie in API route (cookie adapter)', {
      name,
      valueLength: value.length,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
    })
  }
}

/**
 * Create a Supabase client for API routes with proper cookie handling
 *
 * Pass the final `NextResponse` (including redirects) so `Set-Cookie` headers are
 * attached to the response the browser actually receives.
 */
export async function getSupabaseApiRouteClient(
  request: NextRequest,
  response: NextResponse,
): Promise<SupabaseClient<Database>> {
  assertRunningOnServer('getSupabaseApiRouteClient')
  const cfg = getValidatedEnv()

  const { createServerClient } = await import('@supabase/ssr')

  const url = cfg.NEXT_PUBLIC_SUPABASE_URL
  const key = cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables')
  }

  const requestHostname =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    ''

  const cookieAdapter = {
    getAll() {
      return sanitizeAuthCookiesForRoute(request, response)
    },
    setAll(
      cookiesToSet: Array<{
        name: string
        value: string
        options: Record<string, unknown>
      }>,
    ) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          if (value) {
            applyAuthCookieOptions(name, value, options, response, requestHostname)
          } else {
            response.cookies.set(name, '', {
              path: typeof options.path === 'string' ? options.path : '/',
              maxAge: 0,
            })
          }
        }
      } catch (error) {
        logger.warn('Failed to set cookies in API route', { error })
      }
    },
  }

  return createServerClient<Database>(url, key, {
    cookies: cookieAdapter,
  })
}
