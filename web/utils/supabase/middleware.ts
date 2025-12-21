import type { NextRequest } from 'next/server'

/**
 * Check if a user is authenticated in middleware context (Edge Runtime compatible)
 * 
 * This function works in Edge Runtime by checking for Supabase auth cookies directly
 * without importing @supabase/ssr or @supabase/supabase-js, which are not supported in Edge.
 * 
 * Supabase stores auth tokens in cookies with the pattern:
 * - sb-<project-ref>-auth-token (main auth cookie)
 * - sb-access-token (custom cookie set by our login route)
 * 
 * @param request - The Next.js request object
 * @returns Object with isAuthenticated boolean
 * 
 * @example
 * ```typescript
 * export function middleware(request: NextRequest) {
 *   const { isAuthenticated } = checkAuthInMiddleware(request)
 *   const redirectPath = isAuthenticated ? '/feed' : '/auth'
 *   return NextResponse.redirect(new URL(redirectPath, request.url))
 * }
 * ```
 */
export function checkAuthInMiddleware(
  request: NextRequest
): { isAuthenticated: boolean } {
  // Check for Supabase auth cookies
  // Supabase SSR uses cookies with patterns:
  // - sb-<project-ref>-auth-token (main auth cookie, stores encrypted session)
  // - sb-access-token (our custom cookie, if set)
  // - Cookies may also include refresh tokens and session data
  
  const cookies = request.cookies
  
  // Debug: Log all cookies for troubleshooting (only in non-production or when debugging)
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_MIDDLEWARE === '1') {
    const allCookies = cookies.getAll()
    const allCookieNames = allCookies.map(c => c.name)
    console.log('[checkAuthInMiddleware] All cookies:', allCookieNames)
    
    // Log auth-related cookies in detail
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('session') || 
      c.name.startsWith('sb-')
    )
    if (authCookies.length > 0) {
      console.log('[checkAuthInMiddleware] Auth cookies found:', authCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        hasValue: c.value.length > 0,
      })))
    }
  }
  
  // First, check for our custom access token cookie (if we set one)
  const accessToken = cookies.get('sb-access-token')
  if (accessToken?.value && accessToken.value.length > 0) {
    return { isAuthenticated: true }
  }
  
  // Check for Supabase's standard auth token cookie pattern
  // Supabase project ref is derived from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      // Extract project ref from Supabase URL
      // Patterns: https://xyzabc.supabase.co, https://xyzabc.supabase.io
      const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
      if (urlMatch && urlMatch[1]) {
        const projectRef = urlMatch[1]
        // Check for main auth token cookie
        const authTokenCookie = cookies.get(`sb-${projectRef}-auth-token`)
        if (authTokenCookie?.value && authTokenCookie.value.length > 0) {
          return { isAuthenticated: true }
        }
        // Also check for alternative patterns (with different suffixes)
        const altAuthCookie = cookies.get(`sb-${projectRef}-auth-token-code-verifier`)
        if (altAuthCookie?.value && altAuthCookie.value.length > 0) {
          return { isAuthenticated: true }
        }
      }
    } catch {
      // If URL parsing fails, continue to check other patterns
    }
  }
  
  // Check for any cookie starting with 'sb-' and containing 'auth' or 'session'
  // This catches various Supabase cookie naming patterns used by @supabase/ssr
  for (const cookie of cookies.getAll()) {
    const name = cookie.name
    const value = cookie.value
    // Check for Supabase auth-related cookies
    if (name.startsWith('sb-') && value && value.length > 0) {
      // Check for auth, session, or access in the cookie name
      if (name.includes('auth') || name.includes('session') || name.includes('access')) {
        // Verify the cookie value isn't empty or just whitespace
        if (value.trim().length > 0) {
          return { isAuthenticated: true }
        }
      }
    }
  }
  
  return { isAuthenticated: false }
}

