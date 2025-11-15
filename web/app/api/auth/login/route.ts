import type { NextRequest} from 'next/server';

import {
  withErrorHandling,
  successResponse,
  rateLimitError,
  validationError,
  notFoundError,
  authError,
  parseBody,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient, type Database } from '@/utils/supabase/server'

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
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const rateLimitResult = await apiRateLimiter.checkLimit(
      ip,
      '/api/auth/login',
      withOptional({}, { userAgent })
    );
    
    if (!rateLimitResult.allowed) {
      return rateLimitError('Too many login attempts. Please try again later.');
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

    const normalizedEmail = email.toLowerCase().trim()

    // Use Supabase Auth for authentication
    const supabaseClient = await getSupabaseServerClient()

    // E2E tests should use real Supabase authentication - no mock responses

    // Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    if (signInError || !authData.user) {
      logger.warn('Login failed', { email: normalizedEmail, error: signInError?.message })
      return authError('Invalid email or password');
    }

    // Get user profile for additional data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('username, trust_tier, display_name, avatar_url, bio, is_active')
      .eq('user_id', authData.user.id)
      .single() as { data: UserProfile | null; error: any }

    if (profileError || !profile) {
      logger.warn('User profile not found after login', { userId: authData.user.id })
      return notFoundError('User profile not found');
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
    if (authData.session) {
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      
      // Set access token cookie
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge
      })
      
      // Set refresh token cookie
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge
      })
    }

    return response
});