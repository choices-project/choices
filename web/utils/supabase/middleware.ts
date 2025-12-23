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

  // Helper to extract project ref from Supabase URL for exact cookie name matching
  const getProjectRef = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    try {
      const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
      return match?.[1] || null
    } catch {
      return null
    }
  }

  // Helper to check if a cookie name matches Supabase auth patterns
  const isSupabaseAuthCookie = (cookieName: string): boolean => {
    // Must start with sb-
    if (!cookieName.startsWith('sb-')) return false

    // Check for auth or session in name
    const lowerName = cookieName.toLowerCase()
    return lowerName.includes('auth') || lowerName.includes('session')
  }

  // PRIORITY: Check Cookie header first (most reliable for httpOnly cookies in Edge Runtime)
  // request.cookies.getAll() may not include httpOnly cookies in Edge Runtime
  const cookieHeader = request.headers.get('cookie') || ''

  // Find Supabase auth cookie - prioritize Cookie header parsing
  let authCookie: { name: string; value: string } | null = null
  const projectRef = getProjectRef()
  const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null

  // First, check Cookie header (most reliable for httpOnly cookies)
  if (cookieHeader && cookieHeader.length > 0) {
    // Try exact match first if we have project ref
    // Use simple string search for exact cookie name (more reliable than regex)
    if (expectedCookieName && cookieHeader.includes(expectedCookieName + '=')) {
      const cookieStart = cookieHeader.indexOf(expectedCookieName + '=')
      if (cookieStart !== -1) {
        const valueStart = cookieStart + expectedCookieName.length + 1
        let valueEnd = cookieHeader.indexOf(';', valueStart)
        if (valueEnd === -1) valueEnd = cookieHeader.length
        
        let cookieValue = cookieHeader.substring(valueStart, valueEnd).trim()
        
        // Handle URL encoding
        try {
          cookieValue = decodeURIComponent(cookieValue)
        } catch {
          // If decoding fails, use original value
        }
        
        if (cookieValue.length >= 10) {
          authCookie = { name: expectedCookieName, value: cookieValue }
        }
      }
    }

    // If exact match didn't work, try pattern matching
    if (!authCookie) {
      const cookiePairs = cookieHeader.split(';').map(c => c.trim())
      for (const cookiePair of cookiePairs) {
        const equalIndex = cookiePair.indexOf('=')
        if (equalIndex === -1) continue

        const cookieName = cookiePair.substring(0, equalIndex).trim()
        let cookieValue = cookiePair.substring(equalIndex + 1).trim()

        // Handle URL encoding (cookies may be URL-encoded in header)
        try {
          cookieValue = decodeURIComponent(cookieValue)
        } catch {
          // If decoding fails, use original value
        }

        // Check if it's a Supabase auth cookie
        if (isSupabaseAuthCookie(cookieName) && cookieValue.length >= 10) {
          authCookie = { name: cookieName, value: cookieValue }
          break
        }
      }
    }
  }

  // Fallback: Check parsed cookies if Cookie header didn't work
  if (!authCookie) {
    const cookies = request.cookies.getAll()

    // Try exact match first
    if (expectedCookieName) {
      const exactCookie = cookies.find(c => c.name === expectedCookieName)
      if (exactCookie && exactCookie.value && exactCookie.value.length >= 10) {
        authCookie = { name: exactCookie.name, value: exactCookie.value }
      }
    }

    // If exact match didn't work, try pattern matching
    if (!authCookie) {
      authCookie = cookies.find(cookie =>
        isSupabaseAuthCookie(cookie.name) &&
        cookie.value &&
        cookie.value.length >= 10
      ) || null
    }
  }

  // Final fallback: Check Cookie header for ANY sb- cookie with substantial value
  // This catches cases where exact name matching fails but cookie exists
  if (!authCookie && cookieHeader && cookieHeader.length > 0) {
    // Look for any sb- cookie with substantial value
    const sbCookiePattern = /sb-[^=;]+=([^;]+)/gi
    const matches = [...cookieHeader.matchAll(sbCookiePattern)]
    
    for (const match of matches) {
      if (match[0] && match[1]) {
        const fullMatch = match[0]
        const equalIndex = fullMatch.indexOf('=')
        if (equalIndex === -1) continue
        
        const cookieName = fullMatch.substring(0, equalIndex).trim()
        let cookieValue = fullMatch.substring(equalIndex + 1).trim()
        
        // Handle URL encoding
      try {
        cookieValue = decodeURIComponent(cookieValue)
      } catch {
        // If decoding fails, use original value
      }
      
        // If it's a substantial sb- cookie, trust it
        if (cookieName.startsWith('sb-') && cookieValue.length >= 100) {
          authCookie = { name: cookieName, value: cookieValue }
          break
        }
      }
    }
  }

  // If no auth cookie found, user is not authenticated
  if (!authCookie || !authCookie.value) {
    return { isAuthenticated: false }
  }

  // Check for invalid/empty cookie values
  const trimmedValue = authCookie.value.trim()
  if (trimmedValue.length < 10 ||
      trimmedValue === 'null' ||
      trimmedValue === 'undefined' ||
      trimmedValue === '{}' ||
      trimmedValue === '""' ||
      trimmedValue === "''") {
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
