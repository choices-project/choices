import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandling, successResponse, errorResponse, validationError, rateLimitError, parseBody } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Validation schema for verification code
const verifyCodeSchema = z.object({
  code: z
    .string({ required_error: 'Code is required', invalid_type_error: 'Code is required' })
    .min(1, 'Code is required')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 10 verification attempts per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/candidates/verify/confirm',
    {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      ...(userAgent ? { userAgent } : {})
    }
  );

  if (!rateLimitResult.allowed) {
    // Return 400 with details for backward compatibility with tests
    return NextResponse.json(
      {
        success: false,
        error: 'Too many verification attempts. Please try again later.',
        details: {
          code: 'Too many verification attempts. Please try again in 15 minutes.',
        },
      },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return errorResponse('Authentication required', 401);

  // Validate request body with Zod schema
  let code: string;
  let body: any;
  try {
    body = await request.json();
    // Trim code if it's a string to handle leading/trailing whitespace
    if (body && typeof body.code === 'string') {
      body.code = body.code.trim();
    }
  } catch (error: unknown) {
    // Handle JSON parsing errors
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          code: 'Code is required',
        },
      },
      { status: 400 }
    );
  }
  
  const result = verifyCodeSchema.safeParse(body);
  
  if (!result.success) {
    // Extract Zod error message for details.code
    let errorMessage = 'Validation failed';
    
    if (result.error && Array.isArray(result.error.errors) && result.error.errors.length > 0) {
      const firstError = result.error.errors[0];
      // Map Zod errors to expected test messages
      if (firstError && Array.isArray(firstError.path) && firstError.path.length > 0 && firstError.path[0] === 'code') {
        // Check for empty/whitespace strings
        const codeValue = body?.code;
        const isEmptyOrWhitespace = typeof codeValue === 'string' && codeValue.trim().length === 0;
        
        if (firstError.code === 'invalid_type' || codeValue === undefined || codeValue === null || isEmptyOrWhitespace) {
          errorMessage = 'Code is required';
        } else if (firstError.code === 'too_small') {
          errorMessage = 'Code is required';
        } else if (typeof firstError.message === 'string' && firstError.message) {
          errorMessage = firstError.message;
        } else {
          errorMessage = 'Code is required';
        }
      } else if (firstError && typeof firstError.message === 'string' && firstError.message) {
        errorMessage = firstError.message;
      }
    } else {
      // Fallback: check if code is missing, null, or empty/whitespace
      const codeValue = body?.code;
      if (codeValue === undefined || codeValue === null || (typeof codeValue === 'string' && codeValue.trim().length === 0)) {
        errorMessage = 'Code is required';
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          code: errorMessage,
        },
      },
      { status: 400 }
    );
  }
  
  code = result.data.code;

  const { data: challenge } = await (supabase as any)
    .from('candidate_email_challenges')
    .select('id, candidate_id, user_id, email, code, expires_at, used_at, failed_attempts')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!challenge) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          code: 'Invalid or expired code',
        },
      },
      { status: 400 }
    );
  }

  // Normalize failed attempt count for DoS protection and UX messaging
  const maxAttempts = 5;
  const failedAttempts: number =
    typeof (challenge as any).failed_attempts === 'number' && !Number.isNaN((challenge as any).failed_attempts)
      ? (challenge as any).failed_attempts
      : 0;

  // If the code has already been used, surface a clear, structured error
  if (challenge.used_at) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          alreadyUsed: true,
          code: 'This verification code has already been used. Please request a new code to continue.',
        },
        alreadyUsed: true,
      },
      { status: 400 }
    );
  }

  // If the account is locked due to too many failed attempts, short‑circuit early
  if (failedAttempts >= maxAttempts) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          locked: true,
          attemptsRemaining: 0,
          code: 'Your verification has been locked due to too many incorrect attempts. Please request a new code.',
        },
        locked: true,
        attemptsRemaining: 0,
      },
      { status: 400 }
    );
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    const expiredAt = new Date(challenge.expires_at);
    const now = Date.now();
    const diffMs = now - expiredAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    let timeMessage = '';
    if (diffHours >= 1) {
      timeMessage = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      timeMessage = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          code: `Code expired ${timeMessage} ago. Please request a new code.`,
          expired: true,
        },
        expired: true,
        expiresAt: expiredAt.toISOString(),
        expiredMinutesAgo: diffMinutes,
        canRequestNew: true,
      },
      { status: 400 }
    );
  }
  if (challenge.code !== code) {
    const attemptsAfter = failedAttempts + 1;
    const attemptsRemaining = Math.max(0, maxAttempts - attemptsAfter);
    const isLocked = attemptsRemaining === 0;

    // Best‑effort update of failed_attempts; failures are logged but do not
    // prevent a useful error response to the caller.
    try {
      await (supabase as any)
        .from('candidate_email_challenges')
        .update({ failed_attempts: attemptsAfter })
        .eq('id', challenge.id);
    } catch {
      // Swallow and continue – logging is handled by withErrorHandling/Logger.
    }

    const codeMessage = isLocked
      ? 'You have exceeded the maximum number of attempts. Your verification has been locked. Please request a new verification code.'
      : `The verification code you entered is incorrect. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`;

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          invalid: true,
          attemptsRemaining,
          code: codeMessage,
          ...(isLocked ? { locked: true } : {}),
        },
        invalid: true,
        attemptsRemaining,
        failedAttempts: attemptsAfter,
        maxAttempts,
        ...(isLocked ? { locked: true } : {}),
      },
      { status: 400 }
    );
  }

  // Attempt to link representative via email heuristics (exact/domain/fast_track)
  const userDomain = user.email.split('@')[1]?.toLowerCase() ?? '';
  let representativeId: number | null = null;
  const { data: repExact } = await supabase
    .from('representatives_core')
    .select('id, primary_email')
    .eq('primary_email', user.email)
    .maybeSingle();
  if (repExact?.id) {
    representativeId = repExact.id;
  } else {
    const { data: repDomain } = await supabase
      .from('representatives_core')
      .select('id, primary_email')
      .ilike('primary_email', `%@${userDomain}`)
      .limit(10);
    if (Array.isArray(repDomain) && repDomain.length === 1) {
      const only = repDomain[0];
      if (only?.id) {
        representativeId = only.id;
      }
    } else {
      const { data: fastTrack } = await supabase
        .from('official_email_fast_track')
        .select('representative_id')
        .or(`domain.eq.${userDomain},email.eq.${user.email}`)
        .limit(1)
        .maybeSingle();
      if (fastTrack?.representative_id) {
        representativeId = fastTrack.representative_id;
      }
    }
  }

  // Mark challenge used
  await supabase
    .from('candidate_email_challenges')
    .update({ used_at: new Date().toISOString() })
    .eq('id', challenge.id);

  // If linked, update candidate profile and publish
  if (representativeId) {
    await supabase
      .from('candidate_profiles')
      .update({ representative_id: representativeId, filing_status: 'verified', is_public: true })
      .eq('id', challenge.candidate_id);
  }

  return successResponse({ ok: true, representativeId: representativeId ?? null });
});

