import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
import { checkAuthInMiddleware } from '@/utils/supabase/middleware'

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

  // Environment-based bypass
  const bypass = process.env.NODE_ENV === 'test' || process.env.E2E === '1'

  // Multiple bypass methods for browser compatibility
  const byHeader = req.headers.get(E2E_HEADER) === '1';
  const byQuery = req.nextUrl.searchParams.get('e2e') === '1';
  const byCookie = req.cookies.get(E2E_COOKIE)?.value === '1';

  // Local development bypass
  const isLocal = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.endsWith(':127.0.0.1')
  const isLocalAuth = isLocal && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register'))

  const rateLimitEnabled = Boolean(SECURITY_CONFIG.rateLimit.enabled)

  return Boolean(!rateLimitEnabled ||
         bypass ||
         byHeader ||
         byQuery ||
         byCookie ||
         isLocalAuth)
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

    // Require proper content type for POST requests
    if (method === 'POST' && !SECURITY_CONFIG.validation.allowedContentTypes.some(type =>
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // MAINTENANCE MODE CHECK - This must be first!
  if (process.env.NEXT_PUBLIC_MAINTENANCE === "1") {
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

  // Handle root path redirect based on authentication status
  if (pathname === '/') {
    // Create a temporary response for auth check (cookie adapter needs a response object)
    // We'll create the actual redirect response after checking auth
    const tempResponse = NextResponse.next();
    
    // Check authentication status
    const { isAuthenticated } = await checkAuthInMiddleware(request, tempResponse);
    
    // Determine redirect destination
    const redirectPath = isAuthenticated ? '/feed' : '/auth';
    const redirectUrl = new URL(redirectPath, request.url);
    
    // Create redirect response
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    
    // Copy cookies from tempResponse to redirectResponse (in case auth check set any)
    // Note: Supabase SSR cookie adapter will have already written cookies to tempResponse
    // We need to copy them to the redirect response
    tempResponse.cookies.getAll().forEach((cookie) => {
      const cookieOptions: {
        path?: string;
        domain?: string;
        maxAge?: number;
        expires?: Date;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
      } = {};
      
      if (cookie.path) cookieOptions.path = cookie.path;
      if (cookie.domain) cookieOptions.domain = cookie.domain;
      if (cookie.maxAge !== undefined) cookieOptions.maxAge = cookie.maxAge;
      if (cookie.httpOnly !== undefined) cookieOptions.httpOnly = cookie.httpOnly;
      if (cookie.secure !== undefined) cookieOptions.secure = cookie.secure;
      if (cookie.sameSite) cookieOptions.sameSite = cookie.sameSite as 'strict' | 'lax' | 'none';
      
      // Only set expires if it exists and is a valid number
      if (cookie.expires && typeof cookie.expires === 'number') {
        cookieOptions.expires = new Date(cookie.expires * 1000);
      }
      
      redirectResponse.cookies.set(cookie.name, cookie.value, cookieOptions);
    });
    
    // Add cache headers to help with redirect performance
    redirectResponse.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    return redirectResponse;
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
  response.headers.set('Content-Security-Policy', buildCSPHeaderFromConfig(SECURITY_CONFIG.csp))

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
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - workbox-* (service worker files)
     * - icons/ (PWA icons)
     * - api/health (health check endpoint - must work during maintenance)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-|icons/|api/health).*)',
  ],
}
