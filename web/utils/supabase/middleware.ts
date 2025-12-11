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
  // Supabase uses cookies with pattern: sb-<project-ref>-auth-token
  // We also set sb-access-token in our login route
  
  const cookies = request.cookies
  
  // Check for our custom access token cookie
  const accessToken = cookies.get('sb-access-token')
  if (accessToken?.value) {
    return { isAuthenticated: true }
  }
  
  // Check for Supabase's standard auth token cookie
  // Supabase project ref is derived from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      // Extract project ref from Supabase URL (e.g., https://xyzabc.supabase.co -> xyzabc)
      const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
      if (urlMatch && urlMatch[1]) {
        const projectRef = urlMatch[1]
        const authTokenCookie = cookies.get(`sb-${projectRef}-auth-token`)
        if (authTokenCookie?.value) {
          return { isAuthenticated: true }
        }
      }
    } catch {
      // If URL parsing fails, continue to check other patterns
    }
  }
  
  // Check for any cookie starting with 'sb-' and containing 'auth'
  // This catches various Supabase cookie naming patterns
  for (const cookie of cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('auth') && cookie.value) {
      return { isAuthenticated: true }
    }
  }
  
  return { isAuthenticated: false }
}

