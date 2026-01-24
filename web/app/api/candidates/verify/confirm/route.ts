// Server route handler

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validationError,
} from '@/lib/api';
import {
  CANDIDATE_EMAIL_CHALLENGE_SELECT_COLUMNS,
  OFFICIAL_EMAIL_FAST_TRACK_SELECT_COLUMNS,
} from '@/lib/api/response-builders';
import { createRateLimiter, rateLimitMiddleware } from '@/lib/core/security/rate-limit';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

// Validation schema for verification code confirmation
// Order matters: check required first, then format
const verifyConfirmSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .regex(/^\d+$/, 'Code must contain only digits')
    .max(10, 'Code must be at most 10 characters'),
});

const MAX_FAILED_ATTEMPTS = 5;
const CODE_VALIDITY_MINUTES = 15;
const RATE_LIMIT_ATTEMPTS = 10;
const RATE_LIMIT_BURST = 5;

type ErrorMeta = Record<string, unknown>;

type SingleResult<T> = { data: T | null; error: unknown };

const createErrorResponse = (
  status: number,
  message: string,
  details: Record<string, unknown>,
  extra: ErrorMeta = {},
) =>
  NextResponse.json(
    {
      success: false,
      error: message,
      details,
      ...extra,
    },
    { status },
  );

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;
    const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`;
    if (remainderMinutes > 0) {
      return `${hourLabel} ${remainderMinutes} minute${remainderMinutes === 1 ? '' : 's'}`;
    }
    return hourLabel;
  }
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const buildAttemptsMeta = (failedAttempts: number) => ({
  failedAttempts,
  attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
  maxAttempts: MAX_FAILED_ATTEMPTS,
});

const executeUpdateById = async (builder: any, id: string) => {
  if (builder && typeof builder.eq === 'function') {
    return builder.eq('id', id);
  }
  return builder;
};

const normalizeSingleResult = <T>(result: SingleResult<T> | null | undefined): SingleResult<T> =>
  result ?? { data: null, error: null };

const requestLimiter = createRateLimiter({
  interval: CODE_VALIDITY_MINUTES * 60 * 1000,
  uniqueTokenPerInterval: RATE_LIMIT_ATTEMPTS,
  maxBurst: RATE_LIMIT_BURST,
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rate = await rateLimitMiddleware(request, requestLimiter);
  if (!rate.allowed) {
    const meta = {
      rateLimited: true,
      retryAfterMinutes: CODE_VALIDITY_MINUTES,
      canRequestNew: true,
    };
    return createErrorResponse(
      400,
      'Rate limit exceeded',
      {
        code: `Too many verification attempts. Please try again later (available again in ${CODE_VALIDITY_MINUTES} minutes).`,
        ...meta,
      },
      meta,
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.id) return errorResponse('Authentication required', 401);

  // Parse and validate request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return validationError({ body: 'Request body must be valid JSON' });
  }

  // Trim whitespace from code before validation
  if (rawBody && typeof rawBody === 'object' && 'code' in rawBody && typeof rawBody.code === 'string') {
    rawBody.code = rawBody.code.trim();
  }

  // Validate with Zod schema
  const validationResult = verifyConfirmSchema.safeParse(rawBody);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    // Take the first error for each field to prioritize required/format errors in order
    validationResult.error.issues.forEach((issue) => {
      const field = issue.path[0] as string || 'code';
      // Only set if not already set (first error wins)
      if (!fieldErrors[field]) {
        // Normalize error messages for missing/undefined/empty fields
        let message = issue.message;
        if (message.includes('expected string, received undefined') || 
            message.includes('Required') ||
            message.includes('String must contain at least 1 character(s)')) {
          message = 'Code is required';
        }
        fieldErrors[field] = message;
      }
    });
    return validationError(fieldErrors, 'Invalid verification code format');
  }

  const { code } = validationResult.data;

  // Find the most recent challenge for this user
  const challengeQuery = supabase
    .from('candidate_email_challenges')
    .select(CANDIDATE_EMAIL_CHALLENGE_SELECT_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const challengeResult = await challengeQuery.maybeSingle();

  const challenge = challengeResult.data;
  const challengeError = challengeResult.error;

  if (challengeError || !challenge) {
    return validationError({ code: 'Invalid or expired code' });
  }

  // Check if expired
  const expiresAt = new Date(challenge.expires_at);
  const now = new Date();
  if (expiresAt < now) {
    const minutesAgo = Math.max(1, Math.floor((now.getTime() - expiresAt.getTime()) / 60000));
    const durationText = formatDuration(minutesAgo);
    const meta = {
      expired: true,
      expiresAt: challenge.expires_at,
      expiredMinutesAgo: minutesAgo,
      canRequestNew: true,
    };
    return createErrorResponse(
      400,
      'Verification code expired',
      {
        code: `Verification code has expired. Codes are valid for ${CODE_VALIDITY_MINUTES} minutes. This code expired ${durationText} ago. Please request a new code.`,
        ...meta,
      },
      meta,
    );
  }

  // Check if already used
  if (challenge.used_at) {
    const meta = {
      alreadyUsed: true,
      usedAt: challenge.used_at,
      canRequestNew: true,
    };
    return createErrorResponse(
      400,
      'Verification code already used',
      {
        code: 'This verification code has already been used. Please request a new code.',
        ...meta,
      },
      meta,
    );
  }

  // Check if locked (max attempts exceeded)
  const failedAttempts = (challenge as any).failed_attempts || 0;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const meta = {
      locked: true,
      canRequestNew: true,
      ...buildAttemptsMeta(failedAttempts),
      attemptsRemaining: 0,
    };
    return createErrorResponse(
      400,
      'Verification code lockout',
      {
        code: 'Attempt limit exceeded. This code is locked. Please request a new verification code.',
        ...meta,
      },
      meta,
    );
  }

  // Check if code matches
  if (challenge.code !== code.trim()) {
    // Increment failed attempts
    const newFailedAttempts = failedAttempts + 1;
    const failedAttemptsBuilder = supabase
      .from('candidate_email_challenges')
      .update({ failed_attempts: newFailedAttempts } as any);
    await executeUpdateById(failedAttemptsBuilder, challenge.id);

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockMeta = {
        locked: true,
        canRequestNew: true,
        ...buildAttemptsMeta(newFailedAttempts),
        attemptsRemaining: 0,
      };
      return createErrorResponse(
        400,
        'Verification code lockout',
        {
          code: 'Attempt limit exceeded. This code is locked. Please request a new verification code.',
          ...lockMeta,
        },
        lockMeta,
      );
    }

    const attemptsMeta = buildAttemptsMeta(newFailedAttempts);
    const meta = {
      invalid: true,
      ...attemptsMeta,
    };
    const detailMessage = `incorrect verification code. ${attemptsMeta.attemptsRemaining} attempt${
      attemptsMeta.attemptsRemaining === 1 ? '' : 's'
    } remaining before the code locks.`;
    return createErrorResponse(
      400,
      'Incorrect verification code',
      {
        code: detailMessage,
        ...meta,
      },
      meta,
    );
  }

  // Code is correct - mark as used
  const usedAtBuilder = supabase
    .from('candidate_email_challenges')
    .update({
      used_at: new Date().toISOString(),
    });
  const updateResult = await executeUpdateById(usedAtBuilder, challenge.id);
  const updateError = updateResult?.error ?? null;

  if (updateError) {
    return errorResponse('Failed to update challenge', 500);
  }

  // Check if email matches an official email domain
  const profileUpdates: Record<string, unknown> = {};
  const emailDomain = challenge.email?.split('@')[1]?.toLowerCase();
  if (emailDomain) {
    // Check official_email_fast_track table
    const officialEmailBuilder = supabase
      .from('official_email_fast_track')
      .select(OFFICIAL_EMAIL_FAST_TRACK_SELECT_COLUMNS)
      .or(`domain.eq.${emailDomain},email.eq.${challenge.email}`)
      .limit(1);
    if (officialEmailBuilder && typeof officialEmailBuilder.maybeSingle === 'function') {
      const officialEmailResultRaw = await officialEmailBuilder.maybeSingle();
      const officialEmailResult = normalizeSingleResult(officialEmailResultRaw);
      const officialEmail = officialEmailResult.data;

      if (officialEmail) {
        profileUpdates.verified_email = challenge.email;
        profileUpdates.email_verified_at = new Date().toISOString();
      }
    }
  }

  // Attempt to link representative by email
  let representativeId: number | null = null;
  if (challenge.email) {
    try {
      const representativeBuilder = supabase
        .from('representatives_core')
        .select('id, primary_email')
        .eq('primary_email', challenge.email)
        .limit(1);

      if (representativeBuilder && typeof representativeBuilder.maybeSingle === 'function') {
        const representativeResultRaw = await representativeBuilder.maybeSingle();
        const representativeResult = normalizeSingleResult(representativeResultRaw);
        representativeId = representativeResult.data?.id ?? null;
      }
    } catch {
      representativeId = null;
    }
    if (representativeId) {
      profileUpdates.representative_id = representativeId;
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
    const profileUpdateBuilder = supabase.from('candidate_profiles').update(profileUpdates as any);
    const profileUpdateResult = await executeUpdateById(profileUpdateBuilder, challenge.candidate_id);
    const profileError = profileUpdateResult?.error ?? null;
    if (profileError) {
      logger.error(
        'Failed to update candidate profile after verification',
        profileError instanceof Error ? profileError : new Error(String(profileError)),
      );
    }
  }

  return successResponse(
    representativeId
      ? { ok: true, representativeId }
      : { ok: true },
  );
});

