import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security configuration
const securityConfig = {
  // Rate limiting by endpoint type
  rateLimits: {
    feedback: { windowMs: 15 * 60 * 1000, max: 5 },    // 5 feedback per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, max: 10 },       // 10 auth attempts per 15 minutes
    api: { windowMs: 15 * 60 * 1000, max: 100 },       // 100 API calls per 15 minutes
    admin: { windowMs: 15 * 60 * 1000, max: 50 }       // 50 admin requests per 15 minutes
  },
  
  // Content filtering
  contentFilters: {
    maxLength: 1000,                                   // Max characters
    suspiciousPatterns: [
      /[A-Z]{5,}/,                                    // ALL CAPS
      /!{3,}/,                                        // Multiple exclamation marks
      /https?:\/\/[^\s]+/g,                           // URLs
      /spam|scam|click here/i                          // Spam words
    ]
  }
}

// Rate limiting function
function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number } {
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  const limit = securityConfig.rateLimits[endpoint as keyof typeof securityConfig.rateLimits]
  
  if (!limit) return { allowed: true, remaining: 999 }
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs })
    return { allowed: true, remaining: limit.max - 1 }
  }
  
  if (record.count >= limit.max) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: limit.max - record.count }
}

// Content validation function
function validateContent(content: string, field: string): { valid: boolean; reason?: string } {
  if (content.length > securityConfig.contentFilters.maxLength) {
    return { valid: false, reason: `${field} too long` }
  }
  
  for (const pattern of securityConfig.contentFilters.suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: `${field} suspicious content detected` }
    }
  }
  
  return { valid: true }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get real IP (respecting proxies)
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'

  // Check if Supabase credentials are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // If no Supabase credentials, allow all requests (for local development)
    return supabaseResponse
  }

  // Rate limiting check
  const path = request.nextUrl.pathname
  let endpoint = 'api' // default
  
  if (path.includes('/api/feedback')) endpoint = 'feedback'
  else if (path.includes('/api/auth')) endpoint = 'auth'
  else if (path.includes('/api/admin')) endpoint = 'admin'
  
  const rateLimit = checkRateLimit(ip, endpoint)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 900 },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'Retry-After': '900'
        }
      }
    )
  }

  // Content validation for POST requests
  if (request.method === 'POST' && path.includes('/api/feedback')) {
    try {
      const body = await request.clone().json()
      
      // Validate title if present
      if (body.title) {
        const titleValidation = validateContent(body.title, 'title')
        if (!titleValidation.valid) {
          return NextResponse.json(
            { error: titleValidation.reason },
            { status: 400 }
          )
        }
      }
      
      // Validate description if present
      if (body.description) {
        const descriptionValidation = validateContent(body.description, 'description')
        if (!descriptionValidation.valid) {
          return NextResponse.json(
            { error: descriptionValidation.reason },
            { status: 400 }
          )
        }
      }
    } catch (error) {
      // Invalid JSON - continue with normal processing
      // Error logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware content validation error:', error)
      }
    }
  }

  // Request size limit
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return NextResponse.json(
      { error: 'Request too large' },
      { status: 413 }
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/create-poll', '/admin']
  const authRoutes = ['/login', '/register']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Redirect logic
  if (isProtectedRoute && !user) {
    // Redirect to login if accessing protected route without authentication
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    // Redirect to dashboard if accessing auth routes while authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add security headers to response
  supabaseResponse.headers.set('X-RateLimit-Limit', '100')
  supabaseResponse.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
