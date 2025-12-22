import type { NextRequest } from 'next/server'

/**
 * @deprecated This function is deprecated. Use standard Supabase SSR approach instead.
 *
 * The main middleware now uses `createServerClient` from `@supabase/ssr` with `getUser()`
 * which is the recommended approach. This function is kept for backward compatibility
 * but should not be used in new code.
 *
 * Check if a user is authenticated in middleware context (Edge Runtime compatible)
 *
 * This function works in Edge Runtime by checking for Supabase auth cookies directly.
 * It uses manual cookie detection as a fallback when Supabase client creation fails.
 *
 * Supabase stores auth tokens in cookies with the pattern:
 * - sb-<project-ref>-auth-token (main auth cookie, stores encrypted session)
 * - sb-<project-ref>-auth-token.0, sb-<project-ref>-auth-token.1 (chunked cookies for large sessions)
 * - sb-access-token (custom cookie, if set)
 *
 * Based on Supabase SSR documentation (December 2025):
 * - Cookies are set by @supabase/ssr createServerClient
 * - Cookies may be chunked if session data exceeds cookie size limits
 * - Cookie names follow pattern: sb-<project-ref>-auth-token[.chunk-index]
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

    console.warn('[checkAuthInMiddleware] Cookie header length:', cookieHeader.length)

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

      console.warn('[checkAuthInMiddleware] No auth cookies found in parsed cookies')
    }
  }

  // STRATEGY: Check multiple methods to find auth cookies
  // This ensures we catch cookies even if Next.js cookie parsing has issues in Edge Runtime
  // IMPORTANT: In Edge Runtime, httpOnly cookies may not be accessible via request.cookies
  // So we prioritize Cookie header parsing (Method 4) which is more reliable

  // Method 0: FIRST check Cookie header directly (most reliable for httpOnly cookies in Edge Runtime)
  // This is especially important because httpOnly cookies may not be accessible via request.cookies.getAll()
  if (cookieHeader && cookieHeader.length > 0) {
    // Split cookie header by semicolon and check each cookie
    // This is more reliable than regex for edge cases
    const cookiePairs = cookieHeader.split(';').map(c => c.trim())

    for (const cookiePair of cookiePairs) {
      const equalIndex = cookiePair.indexOf('=')
      if (equalIndex === -1) continue

      const cookieName = cookiePair.substring(0, equalIndex).trim().toLowerCase()
      let cookieValue = cookiePair.substring(equalIndex + 1).trim()

      // Handle URL encoding
      try {
        cookieValue = decodeURIComponent(cookieValue)
      } catch {
        // If decoding fails, use original value
      }

      // Check if it's a Supabase auth cookie
      // Pattern: sb-* containing 'auth', 'session', or 'access'
      if (cookieName.startsWith('sb-') &&
          (cookieName.includes('auth') || cookieName.includes('session') || cookieName.includes('access'))) {

        // Check for substantial value (2569 chars should definitely pass)
        // Lower threshold for chunked cookies
        const isChunked = cookieName.includes('.') && /\.\d+$/.test(cookieName)
        const minLength = isChunked ? 5 : 10

        if (cookieValue.length >= minLength &&
            cookieValue !== 'null' &&
            cookieValue !== 'undefined' &&
            cookieValue !== '{}' &&
            cookieValue !== '""' &&
            cookieValue !== "''") {
          if (process.env.DEBUG_MIDDLEWARE === '1') {
            console.warn('[checkAuthInMiddleware] Found auth cookie in header (Method 0):', cookieName, 'length:', cookieValue.length)
          }
          return { isAuthenticated: true }
        }
      }
    }
  }

  // Method 1: Check for our custom access token cookie (if we set one)
  const accessToken = cookies.get('sb-access-token')
  if (accessToken?.value && accessToken.value.length > 0) {
    const trimmedValue = accessToken.value.trim()
    // Check for substantial value (tokens are typically longer than 10 chars)
    if (trimmedValue.length > 10 &&
        trimmedValue !== 'null' &&
        trimmedValue !== 'undefined' &&
        trimmedValue !== '{}' &&
        trimmedValue !== '""' &&
        trimmedValue !== "''") {
      if (process.env.DEBUG_MIDDLEWARE === '1') {
        console.warn('[checkAuthInMiddleware] Found sb-access-token cookie')
      }
      return { isAuthenticated: true }
    }
  }

  // Method 2: Check for Supabase's standard auth token cookie pattern
  // Supabase project ref is derived from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      // Extract project ref from Supabase URL
      // Patterns: https://xyzabc.supabase.co, https://xyzabc.supabase.io
      const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
      if (urlMatch && urlMatch[1]) {
        const projectRef = urlMatch[1]
        const expectedCookieName = `sb-${projectRef}-auth-token`

        // Check for main auth token cookie (case-sensitive as set by Supabase)
        const authTokenCookie = cookies.get(expectedCookieName)
        if (authTokenCookie?.value && authTokenCookie.value.length > 0) {
          const trimmedValue = authTokenCookie.value.trim()
          // Check for substantial value (auth tokens/session data are typically longer)
          // Accept JSON objects (session data) or JWT tokens
          if (trimmedValue.length > 10 &&
              trimmedValue !== 'null' &&
              trimmedValue !== 'undefined' &&
              trimmedValue !== '{}' &&
              trimmedValue !== '""' &&
              trimmedValue !== "''") {
            if (process.env.DEBUG_MIDDLEWARE === '1') {
              console.warn('[checkAuthInMiddleware] Found expected auth cookie:', expectedCookieName)
            }
            return { isAuthenticated: true }
          }
        }

        // Also check for alternative patterns (with different suffixes)
        // Supabase may chunk large cookies into multiple numbered cookies (.0, .1, .2, etc.)
        const altCookieNames = [
          `sb-${projectRef}-auth-token-code-verifier`,
        ]

        // Check numbered chunks (Supabase can create .0, .1, .2, etc. for large sessions)
        for (let i = 0; i < 10; i++) {
          altCookieNames.push(`sb-${projectRef}-auth-token.${i}`)
        }

        for (const altCookieName of altCookieNames) {
          const altAuthCookie = cookies.get(altCookieName)
          if (altAuthCookie?.value && altAuthCookie.value.length > 0) {
            const trimmedValue = altAuthCookie.value.trim()
            // Check for substantial value (even chunked cookies should have content)
            // Lower threshold for chunked cookies as they may be smaller pieces
            const minLength = altCookieName.includes('.') ? 5 : 10
            if (trimmedValue.length >= minLength &&
                trimmedValue !== 'null' &&
                trimmedValue !== 'undefined' &&
                trimmedValue !== '{}' &&
                trimmedValue !== '""' &&
                trimmedValue !== "''") {
              if (process.env.DEBUG_MIDDLEWARE === '1') {
                console.warn('[checkAuthInMiddleware] Found alt auth cookie:', altCookieName)
              }
              return { isAuthenticated: true }
            }
          }
        }
      }
    } catch (error) {
      // If URL parsing fails, continue to check other patterns
      if (process.env.DEBUG_MIDDLEWARE === '1') {
        console.warn('[checkAuthInMiddleware] Error extracting project ref:', error)
      }
    }
  }

  // Method 3: Check ALL cookies for any starting with 'sb-' and containing 'auth' or 'session'
  // This catches various Supabase cookie naming patterns used by @supabase/ssr
  // IMPORTANT: This is a comprehensive fallback that should catch all Supabase auth cookies
  const allCookies = cookies.getAll()

  for (const cookie of allCookies) {
    const name = cookie.name.toLowerCase() // Case-insensitive check
    const value = cookie.value

    // Check for Supabase auth-related cookies
    // Match patterns: sb-*-auth-token, sb-*-auth-token-*, sb-access-token, etc.
    if (name.startsWith('sb-') && value && value.length > 0) {
      // Check for auth, session, or access in the cookie name
      if (name.includes('auth') || name.includes('session') || name.includes('access')) {
        // Verify the cookie value isn't empty or just whitespace/null/undefined
        const trimmedValue = value.trim()
        // Check for substantial value (auth tokens are typically longer than 10 chars)
        // Also accept JSON objects (session data stored as JSON)
        if (trimmedValue.length > 10 &&
            trimmedValue !== 'null' &&
            trimmedValue !== 'undefined' &&
            trimmedValue !== '{}' &&
            trimmedValue !== '""' &&
            trimmedValue !== "''") {
          // Found a valid auth cookie
          if (process.env.DEBUG_MIDDLEWARE === '1') {
            console.warn('[checkAuthInMiddleware] Found auth cookie in parsed cookies:', cookie.name)
          }
          return { isAuthenticated: true }
        }
      }
    }
  }

  // Method 4: Fallback - Check the raw Cookie header string for auth cookies
  // This helps catch cookies that might not be parsed correctly by Next.js middleware
  // or cookies with domain attributes that might not be accessible via request.cookies
  // This is especially important in Edge Runtime where cookie parsing can be more limited
  // NOTE: Method 0 already checks the header first, but this provides additional patterns
  if (cookieHeader && cookieHeader.length > 0) {
    // More permissive pattern: any sb- cookie containing 'auth' anywhere in the name
    // This catches: sb-*-auth-token, sb-*-auth-token.0, sb-access-token, etc.
    const permissiveAuthPattern = /(sb-[^=;]*auth[^=;]*)=([^;]+)/gi
    const permissiveMatches = [...cookieHeader.matchAll(permissiveAuthPattern)]
    for (const match of permissiveMatches) {
      if (match[1] && match[2]) {
        let cookieValue = match[2].trim()

        // Handle URL encoding
        try {
          cookieValue = decodeURIComponent(cookieValue)
        } catch {
          // If decoding fails, use original value
        }

        // Verify the cookie value is valid and substantial
        // 2569 chars should definitely pass this check
        if (cookieValue.length > 10 &&
            cookieValue !== 'null' &&
            cookieValue !== 'undefined' &&
            cookieValue !== '{}' &&
            cookieValue !== '""' &&
            cookieValue !== "''") {
          if (process.env.DEBUG_MIDDLEWARE === '1') {
            console.warn('[checkAuthInMiddleware] Found auth cookie in header (Method 4):', match[1])
          }
          return { isAuthenticated: true }
        }
      }
    }

    // Also check for any sb- cookie that might contain auth data
    // Look for any cookie starting with sb- that has a substantial value (likely auth data)
    const sbCookiePattern = /(sb-[^=;]+)=([^;]+)/gi
    const sbMatches = [...cookieHeader.matchAll(sbCookiePattern)]
    for (const match of sbMatches) {
      const cookieName = match[1].toLowerCase()
      let cookieValue = match[2].trim()

      // Handle URL encoding - cookies in headers may be URL-encoded
      try {
        cookieValue = decodeURIComponent(cookieValue)
      } catch {
        // If decoding fails, use original value
      }

      // If it's an auth-related cookie with a substantial value
      // Lower threshold for chunked cookies (they may be smaller pieces)
      const isChunked = cookieName.includes('.') && /\.\d+$/.test(cookieName)
      const minLength = isChunked ? 5 : 10

      if ((cookieName.includes('auth') || cookieName.includes('session') || cookieName.includes('access')) &&
          cookieValue.length >= minLength &&
          cookieValue !== 'null' &&
          cookieValue !== 'undefined' &&
          cookieValue !== '{}' &&
          cookieValue !== '""' &&
          cookieValue !== "''") {
        if (process.env.DEBUG_MIDDLEWARE === '1') {
          console.warn('[checkAuthInMiddleware] Found substantial auth cookie in header:', cookieName)
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
    console.warn('[checkAuthInMiddleware] Cookie header length:', cookieHeader.length)
    if (cookieHeader) {
      // Log first part of cookie header (sanitized - no values)
      const sanitized = cookieHeader.split(';').map(c => {
        const [name] = c.split('=')
        return name?.trim() || ''
      }).filter(Boolean).join('; ')
      console.warn('[checkAuthInMiddleware] Cookie header names (sanitized):', sanitized.substring(0, 300))
    }
  }

  return { isAuthenticated: false }
}

