
import { getSupabaseServerClient } from '@/utils/supabase/server'

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

import type { Database } from '@/utils/supabase/types'
import type { NextRequest} from 'next/server';

// Use generated types from Supabase - automatically stays in sync with your database schema
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type LoginRequestBody = {
  email?: string;
  password?: string;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
    // CSRF protection is handled by Next.js middleware in production
    // For now, we'll skip CSRF validation in test environment

    // Rate limiting: 10 login attempts per 15 minutes per IP
    // Skip rate limiting in E2E test environments to avoid Redis connection issues
    const isE2E = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '0';
    if (!isE2E) {
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

    // Use Supabase Auth for authentication
    const supabaseClient = await getSupabaseServerClient()

    // E2E tests should use real Supabase authentication - no mock responses

    // Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    })

    if (signInError || !authData.user) {
      logger.warn('Login failed', { email: normalizedEmail, error: signInError?.message })
      return authError('Invalid email or password');
    }

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

    // Create standardized response with user data
    const response = successResponse({
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
    })

    // Set Supabase session cookies for middleware authentication
    // These cookies are critical for session persistence in production
    if (authData.session) {
      const isProduction = process.env.NODE_ENV === 'production'
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      
      // Set access token cookie with proper security settings
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: 'lax', // Allow cross-site requests for OAuth flows
        path: '/',
        maxAge: maxAge
      })
      
      // Set refresh token cookie with proper security settings
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: 'lax', // Allow cross-site requests for OAuth flows
        path: '/',
        maxAge: maxAge
      })
      
      // Also set the session expiry time for client-side checks
      if (authData.session.expires_at) {
        response.cookies.set('sb-session-expires', authData.session.expires_at.toString(), {
          httpOnly: false, // Client needs to read this for session checks
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: maxAge
        })
      }
      
      logger.info('Session cookies set successfully', {
        userId: authData.user.id,
        expiresAt: authData.session.expires_at,
        isProduction
      })
    } else {
      logger.warn('No session returned from Supabase auth - cookies not set', {
        userId: authData.user.id
      })
    }

    return response
});