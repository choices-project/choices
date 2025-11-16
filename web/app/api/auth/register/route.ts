import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  rateLimitError,
  validationError,
  errorResponse,
  parseBody,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

import {
  validateCsrfProtection,
  createCsrfErrorResponse
} from '../_shared'

type RegisterRequestBody = {
  email?: string;
  password?: string;
  username?: string;
  display_name?: string;
};


export const POST = withErrorHandling(async (request: NextRequest) => {
    // Validate CSRF protection for state-changing operation
    if (!(await validateCsrfProtection(request))) {
      return createCsrfErrorResponse()
    }

    // Rate limiting: 5 registration attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const rateLimitResult = await apiRateLimiter.checkLimit(
      ip,
      '/api/auth/register',
      { ...(userAgent ? { userAgent } : {}) }
    );

    if (!rateLimitResult.allowed) {
      return rateLimitError('Too many registration attempts. Please try again later.');
    }

    // Validate request
    const parsedBody = await parseBody<RegisterRequestBody>(request)
    if (!parsedBody.success) {
      return parsedBody.error
    }
    const { email, password, username, display_name } = parsedBody.data

    // Validate required fields
    const missingFields: Record<string, string> = {}
    if (!email) {
      missingFields.email = 'Email is required'
    }
    if (!password) {
      missingFields.password = 'Password is required'
    }
    if (!username) {
      missingFields.username = 'Username is required'
    }
    if (Object.keys(missingFields).length > 0) {
      return validationError(missingFields, 'Email, password, and username are required')
    }

    const ensuredEmail = email!;
    const ensuredPassword = password!;
    const ensuredUsername = username!;

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(ensuredUsername)) {
      return validationError({
        username: 'Username must be 3-20 characters, letters, numbers, hyphens, and underscores only'
      });
    }

    // Validate password strength
    if (ensuredPassword.length < 8) {
      return validationError({
        password: 'Password must be at least 8 characters long'
      });
    }

    const normalizedEmail = ensuredEmail.toLowerCase().trim()
    const normalizedUsername = ensuredUsername.trim()
    const displayName = (display_name ?? ensuredUsername).trim()

    // Use Supabase Auth for registration
    const supabaseClient = await getSupabaseServerClient()

    // Always use real Supabase authentication - no E2E bypasses

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: normalizedEmail,
      password: ensuredPassword,
      options: {
        data: {
          username: normalizedUsername,
          display_name: displayName
        }
      }
    })

    if (authError || !authData.user) {
      logger.warn('Registration failed', { email: normalizedEmail, username: normalizedUsername, error: authError?.message })

      // Handle specific Supabase errors
      if (authError?.message.includes('already registered')) {
        return errorResponse(
          'An account with this email already exists',
          409,
          { email: normalizedEmail },
          'EMAIL_EXISTS'
        );
      }

      return errorResponse(
        'Registration failed. Please try again.',
        400,
        {
          error: authError?.message ?? 'Unknown error',
          details: authError?.status ?? 'No status',
        }
      );
    }

    // Create user profile
    const { data: profile, error: profileError } = await (supabaseClient as any)
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        username: normalizedUsername,
        email: normalizedEmail,
        display_name: displayName,
        trust_tier: 'T1',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      logger.error('Failed to create user profile', profileError, {
        user_id: authData.user.id
      })

      // If profile creation fails, log the issue and rely on a secure backend cleanup process
      // Cleanup of orphaned auth users should be handled by a secure backend process or database trigger
      logger.warn('Orphaned auth user created - cleanup required', {
        user_id: authData.user.id,
        email: authData.user.email,
        timestamp: new Date().toISOString()
      })

      return errorResponse('Registration failed. Please try again.', 500);
    }

    logger.info('User registered successfully', {
      userId: authData.user.id,
      email: authData.user.email,
      username: normalizedUsername
    })

    return successResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        trust_tier: profile.trust_tier,
        display_name: profile.display_name,
        is_active: profile.is_active
      },
      session: authData.session,
      token: authData.session?.access_token, // Add token field for E2E compatibility
      message: 'Registration successful. Please check your email to verify your account.'
    }, undefined, 201);
});
