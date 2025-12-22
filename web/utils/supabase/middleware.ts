import type { NextRequest, NextResponse } from 'next/server'

/**
 * Check if a user is authenticated in middleware context using Supabase SSR
 *
 * Uses Supabase SSR's createServerClient which properly handles cookies and session management.
 * This is the recommended approach for Next.js middleware with Supabase.
 *
 * @param request - The Next.js request object
 * @param response - NextResponse for cookie handling (required)
 * @returns Object with isAuthenticated boolean
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   const { isAuthenticated } = await checkAuthInMiddleware(request, response)
 *   const redirectPath = isAuthenticated ? '/feed' : '/auth'
 *   return NextResponse.redirect(new URL(redirectPath, request.url))
 * }
 * ```
 */
export async function checkAuthInMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<{ isAuthenticated: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAuthenticated: false }
  }

  try {
    const { createServerClient } = await import('@supabase/ssr')

    // Create Supabase client with proper cookie handling for middleware
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // Check if user is authenticated using Supabase's getUser()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      return { isAuthenticated: true }
    }

    return { isAuthenticated: false }
  } catch {
    // If Supabase client creation fails, assume not authenticated
    // This should not happen in Node.js runtime, but handle gracefully
    return { isAuthenticated: false }
  }
}
