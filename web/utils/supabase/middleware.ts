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
  
  // Also check the Cookie header directly as a fallback
  // This helps catch cookies that might not be parsed correctly by Next.js
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Debug: Log all cookies for troubleshooting (always log in production for debugging)
  // Enable with DEBUG_MIDDLEWARE=1 environment variable
  // Note: Using console.warn for debug logs as console.log is not allowed by lint rules
  if (process.env.DEBUG_MIDDLEWARE === '1') {
    const allCookies = cookies.getAll()
    const allCookieNames = allCookies.map(c => c.name)
     
    console.warn('[checkAuthInMiddleware] All cookies:', allCookieNames)
    
    // Log auth-related cookies in detail
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('session') || 
      c.name.startsWith('sb-')
    )
    if (authCookies.length > 0) {
       
      console.warn('[checkAuthInMiddleware] Auth cookies found:', authCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        hasValue: c.value.length > 0,
      })))
    } else {
       
      console.warn('[checkAuthInMiddleware] No auth cookies found')
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
  // IMPORTANT: This is a fallback that should catch all Supabase auth cookies
  const allCookies = cookies.getAll()
  
  // First, try to find auth cookies in the parsed cookies
  for (const cookie of allCookies) {
    const name = cookie.name.toLowerCase() // Case-insensitive check
    const value = cookie.value
    // Check for Supabase auth-related cookies
    // Match patterns: sb-*-auth-token, sb-*-auth-token-*, sb-access-token, etc.
    if (name.startsWith('sb-') && value && value.length > 0) {
      // Check for auth, session, or access in the cookie name
      if (name.includes('auth') || name.includes('session') || name.includes('access')) {
        // Verify the cookie value isn't empty or just whitespace
        const trimmedValue = value.trim()
        if (trimmedValue.length > 0 && trimmedValue !== 'null' && trimmedValue !== 'undefined') {
          // Found a valid auth cookie
          if (process.env.DEBUG_MIDDLEWARE === '1') {
             
            console.warn('[checkAuthInMiddleware] Found auth cookie in parsed cookies:', name)
          }
          return { isAuthenticated: true }
        }
      }
    }
  }
  
  // Fallback: Check the raw Cookie header for auth cookies
  // This helps catch cookies that might not be parsed correctly by Next.js middleware
  // or cookies with domain attributes that might not be accessible via request.cookies
  if (cookieHeader) {
    // Look for sb-*-auth-token pattern in the cookie header
    const authCookieMatch = cookieHeader.match(/sb-[^=]*-auth-token[^;]*=([^;]+)/i)
    if (authCookieMatch && authCookieMatch[1]) {
      const cookieValue = authCookieMatch[1].trim()
      if (cookieValue.length > 0 && cookieValue !== 'null' && cookieValue !== 'undefined') {
        if (process.env.DEBUG_MIDDLEWARE === '1') {
           
          console.warn('[checkAuthInMiddleware] Found auth cookie in Cookie header')
        }
        return { isAuthenticated: true }
      }
    }
    
    // Also check for sb-access-token pattern
    const accessTokenMatch = cookieHeader.match(/sb-access-token[^;]*=([^;]+)/i)
    if (accessTokenMatch && accessTokenMatch[1]) {
      const cookieValue = accessTokenMatch[1].trim()
      if (cookieValue.length > 0 && cookieValue !== 'null' && cookieValue !== 'undefined') {
        if (process.env.DEBUG_MIDDLEWARE === '1') {
           
          console.warn('[checkAuthInMiddleware] Found access token in Cookie header')
        }
        return { isAuthenticated: true }
      }
    }
  }
  
  // No auth cookies found
  if (process.env.DEBUG_MIDDLEWARE === '1') {
     
    console.warn('[checkAuthInMiddleware] No auth cookies found. Total cookies:', allCookies.length)
     
    console.warn('[checkAuthInMiddleware] Cookie names:', allCookies.map(c => c.name))
     
    console.warn('[checkAuthInMiddleware] Cookie header present:', cookieHeader ? 'yes' : 'no')
    if (cookieHeader) {
       
      console.warn('[checkAuthInMiddleware] Cookie header preview:', cookieHeader.substring(0, 200))
    }
  }
  
  return { isAuthenticated: false }
}

