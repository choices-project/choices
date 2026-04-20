import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/lib/config/env'
import {
  getSecurityConfig,
  buildCSPHeader as buildCSPHeaderFromConfig,
  isBlockedUserAgent,
  anonymizeIP
} from '@/lib/core/security/config'
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  resolveLocale
} from '@/lib/i18n/config'
import logger from '@/lib/utils/logger'


/**
 * Security Middleware
 * Implements comprehensive security headers and CSP policies
 *
 * Security Features:
 * - Content Security Policy (CSP)
 * - Security headers (HSTS, X-Frame-Options, etc.)
 * - Rate limiting for sensitive endpoints
 * - Request validation and sanitization
 *
 * Created: 2025-08-27
 * Status: Critical security enhancement
 */

// Get security configuration
const SECURITY_CONFIG = getSecurityConfig()

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if request should bypass rate limiting for E2E tests
 * Supports multiple bypass methods to handle browser-specific quirks
 */
function shouldBypassForE2E(req: NextRequest): boolean {
  const E2E_HEADER = 'x-e2e-bypass';
  const E2E_COOKIE = 'E2E';

  // Environment-based bypass - NEVER in production
  const isDev = process.env.NODE_ENV !== 'production';
  const bypass = isDev && (process.env.NODE_ENV === 'test' || env.E2E === '1');

  // Multiple bypass methods for browser compatibility - ONLY in non-production
  const byHeader = isDev && req.headers.get(E2E_HEADER) === '1';
  const byQuery = isDev && req.nextUrl.searchParams.get('e2e') === '1';
  const byCookie = isDev && req.cookies.get(E2E_COOKIE)?.value === '1';

  // Local development bypass
  const isLocal = isDev || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.endsWith(':127.0.0.1');
  const isLocalAuth = isLocal && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register'));

  const rateLimitEnabled = Boolean(SECURITY_CONFIG.rateLimit.enabled);

  return Boolean(!rateLimitEnabled ||
         bypass ||
         byHeader ||
         byQuery ||
         byCookie ||
         isLocalAuth);
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string, path: string, req: NextRequest): boolean {
  // Bypass rate limiting for E2E tests
  if (shouldBypassForE2E(req)) return true

  const now = Date.now()
  const key = `${ip}:${path}`
  const record = rateLimitStore.get(key)

  // Get rate limit for this endpoint
  const maxRequests = (SECURITY_CONFIG.rateLimit.sensitiveEndpoints)[path] ??
                     SECURITY_CONFIG.rateLimit.maxRequests

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.rateLimit.windowMs
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false // Rate limit exceeded
  }

  // Increment count
  record.count++
  return true
}



/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded headers (common with proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIP = forwarded.split(',')[0]
    if (firstIP) {
      return firstIP.trim()
    }
  }

  // Check for real IP header
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to connection remote address
  return request.ip ?? 'unknown'
}

/**
 * Validate and sanitize request
 */
function isNextInternalRequest(request: NextRequest): boolean {
  const headers = request.headers;
  return (
    headers.get('RSC') === '1' ||
    headers.has('Next-Router-State-Tree') ||
    headers.has('Next-Action') ||
    headers.has('Next-Url') ||
    headers.has('x-nextjs-data') ||
    (headers.get('accept') ?? '').includes('text/x-component')
  );
}

function validateRequest(request: NextRequest): { valid: boolean; reason?: string } {
  const url = request.nextUrl
  const method = request.method

  // Validate URL path for security
  const pathname = url.pathname
  if (pathname.includes('..') || pathname.includes('//')) {
    return { valid: false, reason: 'Invalid URL path' }
  }

  // Block suspicious requests
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    const contentType = request.headers.get('content-type')
    const isNextInternal = isNextInternalRequest(request)

    // Require proper content type for POST requests
    if (method === 'POST' && !isNextInternal && !SECURITY_CONFIG.validation.allowedContentTypes.some(type =>
        contentType?.includes(type))) {
      return { valid: false, reason: 'Invalid content type' }
    }

    // Check for suspicious user agents
    const userAgent = request.headers.get('user-agent')
    if (userAgent && isBlockedUserAgent(userAgent, SECURITY_CONFIG.validation)) {
      return { valid: false, reason: 'Suspicious user agent' }
    }
  }

  return { valid: true }
}

/**
 * Authentication Diagnostics Type
 * Used to provide detailed information about cookie detection for debugging
 */
export type AuthDiagnostics = {
  cookieHeaderPresent: boolean
  cookieHeaderLength: number
  hasSbInHeader: boolean
  projectRef: string | null
  expectedCookieName: string | null
  authCookieFound: boolean
  authCookieName: string | null
  authCookieValueLength: number
  parsedCookiesCount: number
  parsedCookiesHasSb: boolean
}

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
 * WORKAROUND: SameSite=Lax cookies may not be sent on programmatic top-level navigations
 * (like page.goto() in tests), but they ARE sent on same-site fetch requests (like RSC).
 * This function detects cookies when available, and the middleware handles the case
 * where cookies aren't available on initial navigation.
 */
function checkAuthInMiddleware(
  request: NextRequest
): { isAuthenticated: boolean; diagnostics: AuthDiagnostics } {
  const diagnostics: AuthDiagnostics = {
    cookieHeaderPresent: false,
    cookieHeaderLength: 0,
    hasSbInHeader: false,
    projectRef: null,
    expectedCookieName: null,
    authCookieFound: false,
    authCookieName: null,
    authCookieValueLength: 0,
    parsedCookiesCount: 0,
    parsedCookiesHasSb: false,
  }

  /** Verbose cookie/auth tracing (opt-in). Avoid logging on every request in dev/demo. */
  const verboseAuthMiddlewareLog = env.DEBUG_MIDDLEWARE === '1'

  const getProjectRef = (): string | null => {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    try {
      const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
      return match?.[1] || null
    } catch {
      return null
    }
  }

  const isValidCookieValue = (value: string): boolean => {
    const trimmed = value.trim()
    return (
      trimmed.length >= 20 &&
      trimmed !== 'null' &&
      trimmed !== 'undefined' &&
      trimmed !== '{}' &&
      trimmed !== '""' &&
      trimmed !== "''"
    )
  }

  const parseCookieHeader = (header: string): Array<{ name: string; value: string }> => {
    if (!header) return []
    const pairs = header.split(';')
    const parsed: Array<{ name: string; value: string }> = []
    for (const pair of pairs) {
      const equalIndex = pair.indexOf('=')
      if (equalIndex === -1) continue
      const name = pair.slice(0, equalIndex).trim()
      if (!name) continue
      let value = pair.slice(equalIndex + 1).trim()
      try {
        value = decodeURIComponent(value)
      } catch {
        // Keep raw value if decode fails.
      }
      parsed.push({ name, value })
    }
    return parsed
  }

  const buildChunkedCookieValue = (
    cookiesToInspect: Array<{ name: string; value: string }>,
    cookieBaseName: string,
  ): string | null => {
    const chunkRegex = new RegExp(`^${cookieBaseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(\\d+)$`)
    const chunks = cookiesToInspect
      .map((cookie) => {
        const match = cookie.name.match(chunkRegex)
        if (!match || !match[1]) return null
        return { index: Number(match[1]), value: cookie.value }
      })
      .filter((chunk): chunk is { index: number; value: string } => chunk !== null)
      .sort((a, b) => a.index - b.index)
    if (chunks.length === 0) return null
    return chunks.map((chunk) => chunk.value).join('')
  }

  // PRIORITY: Check Cookie header first (most reliable for httpOnly cookies in Edge Runtime)
  // request.cookies.getAll() may not include httpOnly cookies in Edge Runtime
  const cookieHeader = request.headers.get('cookie') || ''
  const pathname = request.nextUrl.pathname

  if (verboseAuthMiddlewareLog) {
    console.warn('[checkAuthInMiddleware] Cookie detection start:', {
      pathname,
      cookieHeaderPresent: Boolean(cookieHeader),
      cookieHeaderLength: cookieHeader.length,
      hasSbInHeader: cookieHeader.includes('sb-'),
    })
    if (cookieHeader) {
      const cookieNames = cookieHeader.split(';').map(c => {
        const [name] = c.split('=')
        return name?.trim() || ''
      }).filter(Boolean)
      console.warn('[checkAuthInMiddleware] Cookie header names (first 10):', cookieNames.slice(0, 10))
    } else {
      console.warn('[checkAuthInMiddleware] No Cookie header on request')
    }
  }

  // Find Supabase auth cookie with strict matching.
  let authCookie: { name: string; value: string } | null = null
  const projectRef = getProjectRef()
  const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null

  // DIAGNOSTIC: Collect diagnostic info
  diagnostics.cookieHeaderPresent = !!cookieHeader
  diagnostics.cookieHeaderLength = cookieHeader.length
  diagnostics.hasSbInHeader = cookieHeader.includes('sb-')
  diagnostics.projectRef = projectRef
  diagnostics.expectedCookieName = expectedCookieName

  const headerCookies = parseCookieHeader(cookieHeader)
  const parsedCookies = request.cookies.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
  }))
  const cookies = [...headerCookies, ...parsedCookies]
  diagnostics.parsedCookiesCount = cookies.length
  diagnostics.parsedCookiesHasSb = cookies.some(c => c.name.startsWith('sb-'))

  if (verboseAuthMiddlewareLog) {
    console.warn('[checkAuthInMiddleware] Parsed cookies:', {
      count: cookies.length,
      names: cookies.map(c => c.name),
      hasSbCookies: cookies.some(c => c.name.startsWith('sb-')),
    })
  }

  // DIAGNOSTIC: Log expected cookie name
  if (verboseAuthMiddlewareLog) {
    console.warn('[checkAuthInMiddleware] Project ref:', projectRef)
    console.warn('[checkAuthInMiddleware] Expected cookie name:', expectedCookieName)
  }

  const exactCookie = expectedCookieName
    ? cookies.find((cookie) => cookie.name === expectedCookieName && isValidCookieValue(cookie.value))
    : undefined
  if (exactCookie) {
    authCookie = exactCookie
  }

  if (!authCookie && expectedCookieName) {
    const assembled = buildChunkedCookieValue(cookies, expectedCookieName)
    if (assembled && isValidCookieValue(assembled)) {
      authCookie = { name: expectedCookieName, value: assembled }
    }
  }

  if (!authCookie) {
    const fallbackCookie = cookies.find((cookie) => {
      if (!cookie.name.startsWith('sb-')) return false
      const lowerName = cookie.name.toLowerCase()
      const isAuthTokenLike =
        lowerName.endsWith('-auth-token') ||
        lowerName.includes('-auth-token.') ||
        lowerName === 'sb-access-token'
      return isAuthTokenLike && isValidCookieValue(cookie.value)
    })
    if (fallbackCookie) {
      authCookie = fallbackCookie
    }
  }

  diagnostics.authCookieFound = !!authCookie
  if (authCookie) {
    diagnostics.authCookieName = authCookie.name
    diagnostics.authCookieValueLength = authCookie.value.length
  }

  // If no auth cookie found, user is not authenticated
  if (!authCookie || !authCookie.value) {
    if (verboseAuthMiddlewareLog) {
      console.warn('[checkAuthInMiddleware] No auth cookie found - returning false')
    }
    return { isAuthenticated: false, diagnostics }
  }

  if (!isValidCookieValue(authCookie.value)) {
    if (verboseAuthMiddlewareLog) {
      console.warn('[checkAuthInMiddleware] Auth cookie value is invalid - returning false')
    }
    return { isAuthenticated: false, diagnostics }
  }

  if (verboseAuthMiddlewareLog) {
    console.warn('[checkAuthInMiddleware] Auth cookie found and valid - returning true:', {
      name: authCookie.name,
      valueLength: authCookie.value.length
    })
  }

  return { isAuthenticated: true, diagnostics }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (process.env.NODE_ENV === 'development' && pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  // MAINTENANCE MODE CHECK - This must be first!
  if (env.NEXT_PUBLIC_MAINTENANCE === "1") {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8">
       <title>Maintenance</title>
       <style>body{font-family:system-ui;margin:10vh auto;max-width:720px;padding:0 20px;text-align:center}</style>
       <h1>We'll be right back</h1>
       <p>The site is temporarily offline for maintenance.</p>
       <p><small>Please check back soon.</small></p>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/feed',
    '/dashboard',
    '/profile',
    '/settings',
    '/onboarding',
    '/admin',
    '/analytics',
    '/account',
    '/candidate',
    '/contact',
    '/polls/analytics',
    '/polls/create',
    '/polls/templates',
    '/representatives/my',
    '/representatives/self',
    '/e2e',
  ];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register');
  // OAuth PKCE / magic-link flows set `sb-*` cookies before a real session exists.
  // `checkAuthInMiddleware` treats substantial `sb-*` values as signed-in, so we must
  // never short-circuit these routes (otherwise /auth/callback redirects to /feed
  // before `exchangeCodeForSession` runs — Google OAuth appears "broken").
  const isAuthSessionHandshakeRoute =
    pathname === '/auth/callback' ||
    pathname === '/auth/verify' ||
    pathname.startsWith('/auth/device-flow/') ||
    pathname.startsWith('/auth/reset/confirm')

  // Legacy marketing URL: consolidate to `/` (or `/feed` when signed in), including `/landing/*`
  if (pathname === '/landing' || pathname.startsWith('/landing/')) {
    const { isAuthenticated } = checkAuthInMiddleware(request)
    const targetPath = isAuthenticated ? '/feed' : '/'
    const redirectUrl = new URL(targetPath, request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl, 308)
  }

  // Root path: authenticated users go to feed; unauthenticated users stay on `/` (marketing home)
  if (pathname === '/') {
    const { isAuthenticated, diagnostics } = checkAuthInMiddleware(request)

    if (isAuthenticated) {
      const redirectPath = '/feed'
      const redirectUrl = new URL(redirectPath, request.url)

      if (env.DEBUG_MIDDLEWARE === '1') {
        console.warn('[middleware] Root path redirect:', {
          pathname,
          isAuthenticated,
          redirectPath,
          redirectUrl: redirectUrl.toString(),
          cookieHeaderPresent: diagnostics?.cookieHeaderPresent,
          authCookieFound: diagnostics?.authCookieFound,
          timestamp: new Date().toISOString(),
        })
      }

      const redirectResponse = NextResponse.redirect(redirectUrl, 307)
      redirectResponse.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')

      if (process.env.NODE_ENV !== 'production' && diagnostics) {
        redirectResponse.headers.set('X-Auth-Debug-IsAuthenticated', String(isAuthenticated))
        redirectResponse.headers.set('X-Auth-Debug-RedirectPath', redirectPath)
        redirectResponse.headers.set('X-Auth-Debug-CookieHeaderPresent', String(diagnostics.cookieHeaderPresent))
        redirectResponse.headers.set('X-Auth-Debug-CookieHeaderLength', String(diagnostics.cookieHeaderLength || 0))
        redirectResponse.headers.set('X-Auth-Debug-HasSbInHeader', String(diagnostics.hasSbInHeader))
        redirectResponse.headers.set('X-Auth-Debug-AuthCookieFound', String(diagnostics.authCookieFound))
        redirectResponse.headers.set('X-Auth-Debug-ParsedCookiesCount', String(diagnostics.parsedCookiesCount || 0))
        redirectResponse.headers.set('X-Auth-Debug-ParsedCookiesHasSb', String(diagnostics.parsedCookiesHasSb))
        if (diagnostics.authCookieName) {
          redirectResponse.headers.set('X-Auth-Debug-AuthCookieName', String(diagnostics.authCookieName))
          redirectResponse.headers.set('X-Auth-Debug-AuthCookieValueLength', String(diagnostics.authCookieValueLength || 0))
        }
      }

      return redirectResponse
    }

    if (env.DEBUG_MIDDLEWARE === '1') {
      console.warn('[middleware] Root path: unauthenticated, serving marketing home', {
        pathname,
        isAuthenticated,
        cookieHeaderPresent: diagnostics?.cookieHeaderPresent,
        authCookieFound: diagnostics?.authCookieFound,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // SECURITY: Protect routes that require authentication
  // This is a critical security check - unauthenticated users must be blocked
  if (isProtectedRoute) {
    // SECURITY: E2E bypasses are ONLY allowed in non-production environments.
    // NEVER allow bypass in production - no env var override.
    const allowE2EBypass = process.env.NODE_ENV !== 'production';
    // Check for PLAYWRIGHT_USE_MOCKS env var (even if 0, presence indicates test scenario)
    const isPlaywrightTest = allowE2EBypass && typeof env.PLAYWRIGHT_USE_MOCKS !== 'undefined';
    // Check for E2E bypass cookie - if present, allow bypass (cookie is only set by tests)
    const bypassCookie1 = request.cookies.get('e2e-dashboard-bypass');
    const bypassCookie2 = request.cookies.get('E2E');
    const hasE2EBypassCookie = allowE2EBypass && (bypassCookie1?.value === '1' || bypassCookie2?.value === '1');

    if (env.DEBUG_MIDDLEWARE === '1') {
      console.warn('[middleware] Bypass cookie check:', {
        pathname,
        hasE2EBypassCookie,
        bypassCookie1Value: bypassCookie1?.value,
        bypassCookie2Value: bypassCookie2?.value,
        isPlaywrightTest,
        PLAYWRIGHT_USE_MOCKS: env.PLAYWRIGHT_USE_MOCKS,
        cookieNames: Array.from(request.cookies.getAll()).map((c) => c.name),
        timestamp: new Date().toISOString(),
      });
    }

    // If bypass cookie is present, always allow bypass (cookie is test-specific and secure)
    // Otherwise, check other E2E harness conditions
    // CRITICAL: Check bypass cookie FIRST - if present, skip all auth checks
    const isE2EHarness = allowE2EBypass && (hasE2EBypassCookie || (
      // Only allow in non-production environments OR when Playwright test env vars are present
      (process.env.NODE_ENV !== 'production' || isPlaywrightTest) && (
        env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' ||
        env.PLAYWRIGHT_USE_MOCKS === '1' ||
        env.E2E === '1' ||
        // E2E bypass headers are checked in test environments OR when Playwright env vars are present
        ((process.env.NODE_ENV === 'test' || isPlaywrightTest) && (
          request.headers.get('x-e2e-bypass') === '1'
        ))
      )
    ));

    // CRITICAL: If E2E harness is enabled, skip all authentication checks and allow access
    if (isE2EHarness) {
      if (env.DEBUG_MIDDLEWARE === '1') {
        console.warn('[middleware] E2E harness enabled - bypassing authentication', {
          pathname,
          hasE2EBypassCookie,
          bypassCookie1Value: bypassCookie1?.value,
          bypassCookie2Value: bypassCookie2?.value,
          isPlaywrightTest,
          envHarness: env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1',
          timestamp: new Date().toISOString(),
        });
      }
      // Allow request to proceed - no redirect, no auth check
      return NextResponse.next();
    }

    // Only check authentication if E2E harness is NOT enabled
    if (!isE2EHarness) {
      // SECURITY: Always verify authentication for protected routes
      // No exceptions, no workarounds - cookies must be present and valid
      const { isAuthenticated, diagnostics } = checkAuthInMiddleware(request)

      if (env.DEBUG_MIDDLEWARE === '1') {
        console.warn('[middleware] Protected route check:', {
          pathname,
          isAuthenticated,
          isE2EHarness,
          hasE2EBypassCookie,
          cookieHeaderPresent: diagnostics?.cookieHeaderPresent,
          authCookieFound: diagnostics?.authCookieFound,
          bypassCookieValue: request.cookies.get('e2e-dashboard-bypass')?.value,
          timestamp: new Date().toISOString(),
        })
      }

      // SECURITY: Block unauthenticated access - no exceptions
      if (!isAuthenticated) {
        // Log security event
        logger.warn('Security: Unauthenticated access attempt to protected route', {
          pathname,
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent'),
        })

        // Redirect unauthenticated users to auth page
        const authUrl = new URL('/auth', request.url)
        // Preserve the original destination for redirect after login
        authUrl.searchParams.set('redirectTo', pathname)

        if (env.DEBUG_MIDDLEWARE === '1') {
          console.warn('[middleware] Redirecting unauthenticated user from protected route:', {
            pathname,
            redirectTo: authUrl.toString(),
          })
        }

        return NextResponse.redirect(authUrl, 307)
      }
    }
  }

  // SECURITY: Redirect authenticated users away from auth pages (except /auth itself)
  // This prevents authenticated users from accessing login/register pages
  if (isAuthRoute && pathname !== '/auth' && !isAuthSessionHandshakeRoute) {
    // SECURITY: Verify authentication - cookies must be present and valid
    const { isAuthenticated } = checkAuthInMiddleware(request)

    if (isAuthenticated) {
      // Authenticated users trying to access login/register should go to feed
      return NextResponse.redirect(new URL('/feed', request.url), 307)
    }
    // If not authenticated, allow access to login/register pages
  }

  // Skip middleware for static files and API routes that don't need security headers
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/service-worker.js') ||
    pathname.startsWith('/workbox-') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/api/webhooks/') // Webhooks might need different headers
  ) {
    return NextResponse.next()
  }

  // Validate request
  const validation = validateRequest(request)
  if (!validation.valid) {
    logger.warn(`Security: Blocked suspicious request: ${validation.reason}`, {
      ip: getClientIP(request),
      path: pathname,
      userAgent: request.headers.get('user-agent')
    })

    return new NextResponse('Forbidden', { status: 403 })
  }

  // Check rate limiting for sensitive endpoints (only if enabled)
  const clientIP = getClientIP(request)
  const isSensitiveEndpoint = Object.keys(SECURITY_CONFIG.rateLimit.sensitiveEndpoints)
    .some(endpoint => pathname.startsWith(endpoint))

  if (SECURITY_CONFIG.rateLimit.enabled && isSensitiveEndpoint && !checkRateLimit(clientIP, pathname, request)) {
    logger.warn(`Security: Rate limit exceeded for IP ${clientIP} on ${pathname}`)

    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '900' // 15 minutes
      }
    })
  }

  // Create response
  const response = NextResponse.next()

  if (!pathname.startsWith('/api/')) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
    const acceptLanguage = request.headers.get('accept-language')
    const resolvedLocale = resolveLocale(cookieLocale, acceptLanguage)

    if (cookieLocale !== resolvedLocale) {
      response.cookies.set({
        name: LOCALE_COOKIE_NAME,
        value: resolvedLocale,
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax'
      })
    }
  }

  // Add security headers
  Object.entries(SECURITY_CONFIG.headers).forEach(([header, value]) => {
    response.headers.set(header, value)
  })

  // Add CSP header
  // Check if we're on a Vercel preview domain (hostname-based check as fallback)
  const hostname = request.nextUrl.hostname
  const isVercelPreviewDomain = hostname.includes('.vercel.app') || hostname.includes('.vercel.live')
  const isVercelPreview =
    env.VERCEL_ENV === 'preview' ||
    env.VERCEL_ENV === 'development' ||
    isVercelPreviewDomain ||
    (!!env.VERCEL_URL && process.env.NODE_ENV !== 'production')

  // If we're on a Vercel preview domain, ensure vercel.live is in CSP
  let cspConfig = SECURITY_CONFIG.csp
  if (isVercelPreview && cspConfig['script-src'] && !cspConfig['script-src'].includes('https://vercel.live')) {
    cspConfig = {
      ...cspConfig,
      'script-src': [...cspConfig['script-src'], 'https://vercel.live'],
      'script-src-elem': cspConfig['script-src-elem']
        ? [...cspConfig['script-src-elem'], 'https://vercel.live']
        : ['https://vercel.live'],
    }
  }

  response.headers.set('Content-Security-Policy', buildCSPHeaderFromConfig(cspConfig))

  // Add HSTS header (only for HTTPS)
  if (request.headers.get('x-forwarded-proto') === 'https' ||
      process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Add security logging
  if (process.env.NODE_ENV === 'production') {
    const logIP = SECURITY_CONFIG.privacy.anonymizeIPs ? anonymizeIP(clientIP) : clientIP
    logger.info('Security: Request processed', {
      ip: logIP,
      path: pathname,
      method: request.method,
      userAgent: SECURITY_CONFIG.privacy.logSensitiveData ? request.headers.get('user-agent') : 'anonymized',
      timestamp: new Date().toISOString()
    })
  }

  return response
}

export const config = {
  matcher: [
    '/_next/static/:path*',
    '/((?!api/webhooks|api/og|_next/image|favicon.ico|manifest.json|sw.js|workbox-|icons/|api/health).*)',
  ],
}
