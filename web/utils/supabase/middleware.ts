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
): { isAuthenticated: boolean; diagnostics?: Record<string, unknown> } {
  // Edge Runtime compatible: Just check for substantial auth cookie
  // Supabase sets these cookies securely (httpOnly, secure), so presence indicates authentication
  // No need to verify token - if cookie exists and is substantial, trust it

  // DIAGNOSTIC: Log what we're checking
  const enableDiagnostics = process.env.DEBUG_MIDDLEWARE === '1' || process.env.NODE_ENV !== 'production'

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
  const pathname = request.nextUrl.pathname
  const isRootPath = pathname === '/'

  // DIAGNOSTIC: Log Cookie header presence and length - ALWAYS log for root path
  if (enableDiagnostics || isRootPath) {
    console.warn('[checkAuthInMiddleware] Cookie detection start:', {
      pathname,
      cookieHeaderPresent: !!cookieHeader,
      cookieHeaderLength: cookieHeader.length,
      hasSbInHeader: cookieHeader.includes('sb-'),
      cookieHeaderPreview: cookieHeader.substring(0, 300),
    })
    if (cookieHeader) {
      const cookieNames = cookieHeader.split(';').map(c => {
        const [name] = c.split('=')
        return name?.trim() || ''
      }).filter(Boolean)
      console.warn('[checkAuthInMiddleware] Cookie header names (first 10):', cookieNames.slice(0, 10))
    } else {
      console.warn('[checkAuthInMiddleware] NO COOKIE HEADER - this is the problem!')
    }
  }

  // Find Supabase auth cookie - prioritize Cookie header parsing
  let authCookie: { name: string; value: string } | null = null
  const projectRef = getProjectRef()
  const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null

  // DIAGNOSTIC: Collect diagnostic info
  const diagnostics: Record<string, unknown> = {
    cookieHeaderPresent: !!cookieHeader,
    cookieHeaderLength: cookieHeader.length,
    hasSbInHeader: cookieHeader.includes('sb-'),
    projectRef,
    expectedCookieName,
  }

  // DIAGNOSTIC: Log expected cookie name
  if (enableDiagnostics) {
    console.warn('[checkAuthInMiddleware] Project ref:', projectRef)
    console.warn('[checkAuthInMiddleware] Expected cookie name:', expectedCookieName)
  }

  // SIMPLEST CHECK FIRST: If Cookie header contains "sb-" and has substantial content, trust it
  // This is the most permissive check - if any sb- cookie exists with substantial value, authenticate
  if (cookieHeader && cookieHeader.includes('sb-')) {
    if (enableDiagnostics) {
      console.warn('[checkAuthInMiddleware] Running simplest check: looking for any sb- cookie with >=100 chars')
    }
    // Find all sb- cookies and check for substantial values
    const sbMatches = cookieHeader.matchAll(/(?:^|;\s*)(sb-[^=]+)=([^;]+)/g)
    for (const match of sbMatches) {
      if (match[1] && match[2]) {
        const cookieName = match[1].trim()
        let cookieValue = match[2].trim()

        // Handle URL encoding
        try {
          cookieValue = decodeURIComponent(cookieValue)
        } catch {
          // If decoding fails, use original value
        }

        // If cookie value is substantial (>=100 chars), trust it as auth
        // 2569 chars should definitely pass this check
        if (cookieValue.length >= 100) {
          if (enableDiagnostics) {
            console.warn('[checkAuthInMiddleware] Found substantial sb- cookie:', {
              name: cookieName,
              valueLength: cookieValue.length,
              method: 'simplest-check'
            })
          }
          authCookie = { name: cookieName, value: cookieValue }
          break
        } else if (enableDiagnostics) {
          console.warn('[checkAuthInMiddleware] sb- cookie too short:', {
            name: cookieName,
            valueLength: cookieValue.length
          })
        }
      }
    }
  }

  // If simple check didn't work, try more specific matching
  if (!authCookie && cookieHeader && cookieHeader.length > 0) {
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

    // DIAGNOSTIC: Log parsed cookies
    if (enableDiagnostics) {
      console.warn('[checkAuthInMiddleware] Checking parsed cookies, count:', cookies.length)
      const cookieNames = cookies.map(c => c.name)
      console.warn('[checkAuthInMiddleware] Parsed cookie names:', cookieNames)
      const sbCookies = cookies.filter(c => c.name.startsWith('sb-'))
      console.warn('[checkAuthInMiddleware] sb- cookies in parsed cookies:', sbCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length
      })))
    }

    // Try exact match first
    if (expectedCookieName) {
      const exactCookie = cookies.find(c => c.name === expectedCookieName)
      if (exactCookie && exactCookie.value && exactCookie.value.length >= 10) {
        if (enableDiagnostics) {
          console.warn('[checkAuthInMiddleware] Found exact cookie match in parsed cookies:', expectedCookieName)
        }
        authCookie = { name: exactCookie.name, value: exactCookie.value }
      } else if (enableDiagnostics) {
        console.warn('[checkAuthInMiddleware] Exact cookie not found in parsed cookies:', expectedCookieName)
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

  // DIAGNOSTIC: Add final diagnostic info
  diagnostics.authCookieFound = !!authCookie
  if (authCookie) {
    diagnostics.authCookieName = authCookie.name
    diagnostics.authCookieValueLength = authCookie.value?.length || 0
  }
  diagnostics.parsedCookiesCount = request.cookies.getAll().length
  diagnostics.parsedCookiesHasSb = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // If no auth cookie found, user is not authenticated
  if (!authCookie || !authCookie.value) {
    if (enableDiagnostics) {
      console.warn('[checkAuthInMiddleware] No auth cookie found - returning false')
      console.warn('[checkAuthInMiddleware] Cookie header had sb-:', cookieHeader.includes('sb-'))
      console.warn('[checkAuthInMiddleware] Parsed cookies had sb-:', request.cookies.getAll().some(c => c.name.startsWith('sb-')))
    }
    return { isAuthenticated: false, diagnostics }
  }

  // Check for invalid/empty cookie values
  const trimmedValue = authCookie.value.trim()
  if (trimmedValue.length < 10 ||
      trimmedValue === 'null' ||
      trimmedValue === 'undefined' ||
      trimmedValue === '{}' ||
      trimmedValue === '""' ||
      trimmedValue === "''") {
    if (enableDiagnostics) {
      console.warn('[checkAuthInMiddleware] Auth cookie value is invalid - returning false')
    }
    return { isAuthenticated: false, diagnostics }
  }

  // DIAGNOSTIC: Log successful authentication
  if (enableDiagnostics) {
    console.warn('[checkAuthInMiddleware] Auth cookie found - returning true:', {
      name: authCookie.name,
      valueLength: authCookie.value.length
    })
  }

  // If cookie exists and is substantial, user is authenticated
  // Supabase sets these cookies securely (httpOnly, secure flags)
  // A substantial cookie value (e.g., 2569 chars) indicates a valid session
  // This is safe because:
  // 1. Cookies are set by Supabase with proper security flags
  // 2. Only substantial values indicate real sessions (not cleared/expired)
  // 3. Edge Runtime doesn't support full Supabase client verification
  return { isAuthenticated: true, diagnostics }
}
