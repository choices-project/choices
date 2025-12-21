
import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route'

import {
  withErrorHandling,
  successResponse,
  rateLimitError,
  validationError,
  authError,
  parseBody,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { logger } from '@/lib/utils/logger'

import { NextResponse } from 'next/server'

import type { Database } from '@/utils/supabase/types'
import type { NextRequest} from 'next/server';

// Use generated types from Supabase - automatically stays in sync with your database schema
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type LoginRequestBody = {
  email?: string;
  password?: string;
};

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
    // CSRF protection is handled by Next.js middleware in production
    // For now, we'll skip CSRF validation in test environment

    // Rate limiting: 10 login attempts per 15 minutes per IP.
    // To avoid blocking real users while we refine the UX, this is gated behind
    // AUTH_RATE_LIMIT_ENABLED=1 and always disabled in E2E harness mode.
    const isE2E =
      process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' ||
      process.env.PLAYWRIGHT_USE_MOCKS === '0';
    const isRateLimitEnabled = process.env.AUTH_RATE_LIMIT_ENABLED === '1';

    if (!isE2E && isRateLimitEnabled) {
      const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
      const userAgent = request.headers.get('user-agent') ?? undefined;
      try {
        // Add timeout to rate limiting check to prevent hanging
        const rateLimitPromise = apiRateLimiter.checkLimit(
          ip,
          '/api/auth/login',
          { ...(userAgent ? { userAgent } : {}) }
        );
        const timeoutPromise = new Promise<{ allowed: boolean; remaining: number; resetTime: number; totalHits: number }>((resolve) => {
          setTimeout(() => {
            // Allow request if rate limiting check times out
            resolve({
              allowed: true,
              remaining: 10,
              resetTime: Date.now() + 15 * 60 * 1000,
              totalHits: 1
            });
          }, 2000); // 2 second timeout
        });

        const rateLimitResult = await Promise.race([rateLimitPromise, timeoutPromise]);

        if (!rateLimitResult.allowed) {
          return rateLimitError('Too many login attempts. Please try again later.');
        }
      } catch (error) {
        // If rate limiting fails, log but allow the request to proceed
        logger.warn('Rate limiting check failed, allowing request:', error);
      }
    }

    // Validate request
    const parsedBody = await parseBody<LoginRequestBody>(request)
    if (!parsedBody.success) {
      return parsedBody.error
    }
    const { email, password } = parsedBody.data

    // Validate required fields
    const missingFields: Record<string, string> = {}
    if (!email) {
      missingFields.email = 'Email is required'
    }
    if (!password) {
      missingFields.password = 'Password is required'
    }
    if (Object.keys(missingFields).length > 0) {
      return validationError(missingFields, 'Email and password are required')
    }

    const normalizedEmail = (email ?? '').toLowerCase().trim()

    const normalizedPassword = password ?? ''

    // Create response early so we can use it for cookie handling
    const response = successResponse({
      user: null,
      session: null,
      token: null,
    })

    // Use Supabase Auth for authentication with API route client
    // This ensures cookies are set correctly via NextResponse
    const supabaseClient = await getSupabaseApiRouteClient(request, response)

    // E2E tests should use real Supabase authentication - no mock responses

    // Sign in with Supabase Auth
    // Supabase SSR should automatically set cookies through our cookie adapter
    const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    })

    if (signInError || !authData.user) {
      logger.warn('Login failed', { email: normalizedEmail, error: signInError?.message })
      return authError('Invalid email or password');
    }

    // Note: Supabase SSR with cookie adapter should set cookies automatically
    // But we'll also manually ensure cookies are set as a fallback
    // Check what cookies were set by Supabase SSR
    const cookiesAfterLogin = response.cookies.getAll()
    logger.info('Cookies after signInWithPassword', {
      cookieCount: cookiesAfterLogin.length,
      cookieNames: cookiesAfterLogin.map(c => c.name),
    })

    // Get user profile for additional data
    const { data: initialProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('username, trust_tier, display_name, avatar_url, bio, is_active')
      .eq('user_id', authData.user.id)
      .single() as { data: UserProfile | null; error: any }

    let profile = initialProfile;

    if (profileError || !profile) {
      // For legacy or partially-onboarded accounts, automatically create a minimal profile
      // instead of blocking an otherwise successful login.
      logger.warn('User profile not found after login; attempting auto-provision', {
        userId: authData.user.id,
        error: profileError?.message ?? profileError,
      })

      const { data: createdProfile, error: createError } = await supabaseClient
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: authData.user.email,
          username: authData.user.email?.split('@')[0] ?? null,
          display_name: authData.user.user_metadata?.full_name
            ?? authData.user.email
            ?? 'User',
          bio: null,
          is_active: true,
        } as any)
        .select('username, trust_tier, display_name, avatar_url, bio, is_active, user_id, created_at, updated_at')
        .single()

      if (createError || !createdProfile) {
        // If profile creation fails, log the error but still allow login to succeed
        // with a minimal synthetic profile in memory so the UI can render.
        logger.error('Failed to auto-provision user profile after login', {
          userId: authData.user.id,
          error: createError?.message ?? createError,
        })

        profile = {
          user_id: authData.user.id,
          username: authData.user.email?.split('@')[0] ?? null,
          display_name:
            authData.user.user_metadata?.full_name ??
            authData.user.email ??
            'User',
          bio: null,
          is_active: true,
          trust_tier: null,
          avatar_url: null,
          created_at: new Date().toISOString() as any,
          updated_at: new Date().toISOString() as any,
        } as UserProfile
      } else {
        profile = createdProfile as UserProfile
      }
    }

    // User profile loaded successfully
    const displayName = (profile as any).display_name ?? profile.username ?? authData.user.email ?? 'User'
    logger.info('User profile loaded', { userId: authData.user.id, displayName })

    logger.info('User logged in successfully', {
      userId: authData.user.id,
      email: authData.user.email,
      displayName
    })

    // Update response with user data
    // Note: Supabase SSR has already set cookies through the cookie adapter
    // We just need to update the response body JSON
    const responseData = {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_id: profile.user_id,
          display_name: displayName,
          bio: profile.bio,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        },
        session: authData.session,
        token: authData.session?.access_token
      }
    }

    // Update the response body while preserving cookies set by Supabase SSR
    // Instead of creating a new response, update the existing one
    const responseBody = JSON.stringify(responseData)

    // Get all cookies that were set by Supabase SSR
    const allCookies = response.cookies.getAll()

    // Extract project ref for cookie name (needed for manual setting and logging)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRefMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
    const projectRef = projectRefMatch ? projectRefMatch[1] : 'unknown'
    const authTokenCookieName = `sb-${projectRef}-auth-token`

    // Check if auth cookie was set by Supabase SSR
    const hasAuthCookie = allCookies.some(c =>
      c.name === authTokenCookieName ||
      (c.name.startsWith('sb-') && (c.name.includes('auth') || c.name.includes('session')))
    )

    logger.info('Cookies after signInWithPassword', {
      userId: authData.user.id,
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasAuthCookie,
      expectedCookieName: authTokenCookieName,
    })

    // Create the final response
    const finalResponse = new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Copy all cookies from the original response (set by Supabase SSR)
    // Ensure proper security attributes, especially for auth cookies
    const isProduction = process.env.NODE_ENV === 'production'
    const hostname = request.headers.get('host') || ''
    const isProductionDomain = hostname.includes('choices-app.com')
    const requireSecure = isProduction && isProductionDomain

    allCookies.forEach((cookie) => {
      const isAuthCookie = cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.startsWith('sb-')

      // For auth cookies, FORCE correct attributes regardless of what was set before
      // This ensures cookies are always secure even if Supabase SSR set them incorrectly
      finalResponse.cookies.set(cookie.name, cookie.value, {
        // Force secure values for auth cookies
        httpOnly: isAuthCookie ? true : (cookie.httpOnly ?? undefined),
        secure: isAuthCookie ? requireSecure : (cookie.secure ?? undefined),
        sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none' | undefined) ?? 'lax',
        path: cookie.path ?? '/',
        maxAge: cookie.maxAge,
        // IMPORTANT: Do NOT set domain attribute - let browser handle domain scoping
        // This ensures cookies work correctly with middleware
      })
    })

    // If Supabase SSR didn't set the auth cookie, manually set it
    // This is a fallback to ensure cookies are always set
    if (!hasAuthCookie && authData.session) {
      const sessionData = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
        user: authData.user
      }

      const isProduction = process.env.NODE_ENV === 'production'
      const hostname = request.headers.get('host') || ''
      const isProductionDomain = hostname.includes('choices-app.com')
      const requireSecure = isProduction && isProductionDomain
      const maxAge = 60 * 60 * 24 * 7 // 7 days

      // Set cookie directly on final response
      // IMPORTANT: Do NOT set domain attribute - let browser handle domain scoping
      // This ensures cookies work correctly with middleware
      finalResponse.cookies.set(authTokenCookieName, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: requireSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge,
        // Explicitly omit domain - browser will handle domain scoping automatically
      })

      logger.info('Manually set auth cookie on final response', {
        cookieName: authTokenCookieName,
        userId: authData.user.id,
        secure: requireSecure,
      })
    }

    logger.info('Final response cookies', {
      cookieCount: finalResponse.cookies.getAll().length,
      cookieNames: finalResponse.cookies.getAll().map(c => c.name),
    })

    return finalResponse
});
