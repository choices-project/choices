
import { z } from 'zod'

import { getSupabaseServerClient } from '@/utils/supabase/server'

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

import {
  validateCsrfProtection,
  createCsrfErrorResponse
} from '../_shared'


import type { NextRequest } from 'next/server';

// Validation schema for registration request
const registerSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').min(1, 'Password is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username must contain only letters, numbers, hyphens, and underscores'),
  display_name: z.string().max(100, 'Display name must be at most 100 characters').optional(),
});

type RegisterRequestBody = z.infer<typeof registerSchema>;


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

    // Validate request body parsing
    const parsedBody = await parseBody<RegisterRequestBody>(request)
    if (!parsedBody.success) {
      return parsedBody.error
    }

    // Validate with Zod schema
    const validationResult = registerSchema.safeParse(parsedBody.data)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (field) {
          fieldErrors[field] = issue.message
        }
      })
      return validationError(fieldErrors, 'Invalid registration data')
    }

    const { email, password, username, display_name } = validationResult.data

    // Normalize validated data
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedUsername = username.trim()
    const displayName = (display_name ?? username).trim()

    // Use Supabase Auth for registration
    const supabaseClient = await getSupabaseServerClient()

    // Always use real Supabase authentication - no E2E bypasses

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: normalizedEmail,
      password: password,
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
