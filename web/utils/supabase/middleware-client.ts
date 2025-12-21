/**
 * Supabase Client for Next.js Middleware (Edge Runtime)
 *
 * This module provides a way to create a Supabase client in middleware
 * that works in Edge Runtime by using NextRequest/NextResponse cookies
 * instead of next/headers cookies.
 *
 * Based on Supabase SSR best practices as of December 2025:
 * - Uses @supabase/ssr createServerClient
 * - Provides cookie adapter for Edge Runtime
 * - Handles session refresh automatically
 */

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Create a Supabase client for middleware (Edge Runtime compatible)
 *
 * This function creates a Supabase client that works in Edge Runtime
 * by using NextRequest.cookies and NextResponse.cookies instead of
 * next/headers cookies.
 *
 * @param request - The Next.js request object
 * @param response - The Next.js response object (optional, for cookie writing)
 * @returns Supabase client configured for Edge Runtime
 */
export async function createSupabaseMiddlewareClient(
  request: NextRequest,
  response?: NextResponse
): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  // Dynamically import @supabase/ssr to avoid Edge Runtime issues
  const { createServerClient } = await import('@supabase/ssr')

  // Create cookie adapter for Edge Runtime
  // Uses NextRequest.cookies for reading and NextResponse.cookies for writing
  const cookieAdapter = {
    get: (name: string) => {
      const cookie = request.cookies.get(name)
      return cookie?.value
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      // Only set cookies if we have a response object
      if (!response) {
        return
      }

      try {
        // Determine production status for secure cookies
        const isProduction = process.env.NODE_ENV === 'production'
        const hostname = request.headers.get('host') || ''
        const isProductionDomain = hostname.includes('choices-app.com')
        const requireSecure = isProduction && isProductionDomain

        // For auth cookies, always use secure defaults
        const isAuthCookie = name.includes('auth') || name.includes('session') || name.startsWith('sb-')

        const cookieOptions: {
          httpOnly?: boolean
          secure?: boolean
          sameSite?: 'strict' | 'lax' | 'none'
          path?: string
          maxAge?: number
        } = {
          // Force secure values for auth cookies
          httpOnly: isAuthCookie ? true : (typeof options.httpOnly === 'boolean' ? options.httpOnly : undefined),
          secure: isAuthCookie ? requireSecure : (typeof options.secure === 'boolean' ? options.secure : undefined),
          sameSite: (typeof options.sameSite === 'string' ? options.sameSite : 'lax') as 'strict' | 'lax' | 'none',
          path: typeof options.path === 'string' ? options.path : '/',
        }

        if (typeof options.maxAge === 'number') {
          cookieOptions.maxAge = options.maxAge
        }

        // Set cookie on NextResponse
        // IMPORTANT: Do NOT set domain attribute - let browser handle domain scoping
        response.cookies.set(name, value, cookieOptions)
      } catch (error) {
        // Silently fail in Edge Runtime if cookie setting fails
        // This can happen during build or in certain edge cases
        console.warn('[createSupabaseMiddlewareClient] Failed to set cookie:', name, error)
      }
    },
    remove: (name: string, options: Record<string, unknown>) => {
      // Only remove cookies if we have a response object
      if (!response) {
        return
      }

      try {
        const cookieOptions: {
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
        // Silently fail in Edge Runtime if cookie removal fails
        console.warn('[createSupabaseMiddlewareClient] Failed to remove cookie:', name, error)
      }
    },
  }

  // Create Supabase client with Edge Runtime-compatible cookie adapter
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: cookieAdapter,
  })
}

/**
 * Check if user is authenticated using Supabase client
 *
 * This is a more reliable method than manual cookie detection
 * as it uses Supabase's built-in session validation.
 *
 * @param request - The Next.js request object
 * @param response - The Next.js response object (optional)
 * @returns Object with isAuthenticated boolean and user data
 */
export async function checkAuthWithSupabaseClient(
  request: NextRequest,
  response?: NextResponse
): Promise<{ isAuthenticated: boolean; user?: { id: string; email?: string } }> {
  try {
    const supabase = await createSupabaseMiddlewareClient(request, response)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { isAuthenticated: false }
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  } catch (error) {
    // If Supabase client creation fails, fall back to false
    // This can happen in Edge Runtime if there are issues with imports
    console.warn('[checkAuthWithSupabaseClient] Error checking auth:', error)
    return { isAuthenticated: false }
  }
}

