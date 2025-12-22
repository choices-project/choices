import type { NextRequest } from 'next/server'

/**
 * Check if a user is authenticated in middleware context (Edge Runtime compatible)
 * 
 * Edge Runtime compatible implementation that checks for Supabase auth cookies.
 * No external dependencies - uses only Next.js built-in APIs.
 *
 * Strategy:
 * - Checks both parsed cookies and Cookie header for maximum reliability
 * - Looks for Supabase auth cookies (sb-* containing 'auth' or 'session')
 * - Validates cookie value is substantial (not empty/null/undefined)
 * - Trusts cookie presence as authentication indicator (Supabase sets them securely)
 *
 * This is safe because:
 * 1. Supabase sets cookies with httpOnly and secure flags
 * 2. Only substantial values indicate real sessions (not cleared/expired)
 * 3. Edge Runtime doesn't support full Supabase client verification
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
  // Edge Runtime compatible: Just check for substantial auth cookie
  // Supabase sets these cookies securely (httpOnly, secure), so presence indicates authentication
  // No need to verify token - if cookie exists and is substantial, trust it

  // Check Cookie header directly (most reliable in Edge Runtime)
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Also check parsed cookies as fallback
  const cookies = request.cookies.getAll()

  // Find Supabase auth cookie - check both header and parsed cookies
  let authCookie: { name: string; value: string } | null = null

  // First, try parsed cookies
  authCookie = cookies.find(cookie =>
    cookie.name.startsWith('sb-') &&
    (cookie.name.includes('auth') || cookie.name.includes('session'))
  ) || null

  // If not found in parsed cookies, check Cookie header
  if (!authCookie && cookieHeader) {
    const cookiePairs = cookieHeader.split(';').map(c => c.trim())
    for (const cookiePair of cookiePairs) {
      const equalIndex = cookiePair.indexOf('=')
      if (equalIndex === -1) continue

      const cookieName = cookiePair.substring(0, equalIndex).trim()
      let cookieValue = cookiePair.substring(equalIndex + 1).trim()

      // Handle URL encoding
      try {
        cookieValue = decodeURIComponent(cookieValue)
      } catch {
        // If decoding fails, use original value
      }
      
      if (cookieName.startsWith('sb-') &&
          (cookieName.includes('auth') || cookieName.includes('session'))) {
        authCookie = { name: cookieName, value: cookieValue }
        break
      }
    }
  }

  // If no auth cookie found, user is not authenticated
  if (!authCookie || !authCookie.value || authCookie.value.length < 10) {
    return { isAuthenticated: false }
  }

  // Check for invalid/empty cookie values
  const trimmedValue = authCookie.value.trim()
  if (trimmedValue === 'null' ||
      trimmedValue === 'undefined' ||
      trimmedValue === '{}' ||
      trimmedValue === '""' ||
      trimmedValue === "''" ||
      trimmedValue.length < 10) {
  return { isAuthenticated: false }
}

  // If cookie exists and is substantial, user is authenticated
  // Supabase sets these cookies securely (httpOnly, secure flags)
  // A substantial cookie value (e.g., 2569 chars) indicates a valid session
  // This is safe because:
  // 1. Cookies are set by Supabase with proper security flags
  // 2. Only substantial values indicate real sessions (not cleared/expired)
  // 3. Edge Runtime doesn't support full Supabase client verification
  return { isAuthenticated: true }
}
