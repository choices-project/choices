import { getSupabaseServerClient } from '@/utils/supabase/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError, forbiddenError, notFoundError, rateLimitError } from '@/lib/api';
import { createRateLimiter, rateLimitMiddleware } from '@/lib/core/security/rate-limit'
import {
  sendCandidateJourneyEmail,
  type EmailType
} from '@/lib/services/email/candidate-journey-emails'

import type { NextRequest } from 'next/server'


const journeyEmailLimiter = createRateLimiter({
  interval: 60 * 1000, // 1 minute window
  uniqueTokenPerInterval: 5,
  maxBurst: 2
});

type JourneyEmailOptions = {
  skipRateLimit?: boolean;
};

async function handleJourneyEmailRequest(
  request: Request,
  options?: JourneyEmailOptions
) {
  if (!options?.skipRateLimit) {
    const rateLimitResult = await rateLimitMiddleware(request, journeyEmailLimiter);
    if (!rateLimitResult.allowed) {
      return rateLimitError(
        'Rate limit exceeded for candidate journey emails',
        rateLimitResult.retryAfter ?? undefined
      );
    }
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

  const body = await request.json()
  const {
    type,
    platformId,
    to,
    skipAuth = false
  } = body

  if (!type || !platformId) {
    return validationError({
      type: !type ? 'Type is required' : '',
      platformId: !platformId ? 'Platform ID is required' : ''
    });
  }

  if (!skipAuth && (!authUser || userError)) {
    return authError('Authentication required');
  }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select(`
        *,
        user_profiles!inner(email)
      `)
      .eq('id', platformId)
      .single()

  if (platformError || !platform) {
    return notFoundError('Platform not found');
  }

    // Verify ownership (unless cron job)
  if (!skipAuth && (!authUser || platform.user_id !== authUser.id)) {
    return forbiddenError('Not authorized');
  }

    // Get user email
    const userProfiles = platform.user_profiles as { email?: string } | null | undefined;
    const email = to ?? userProfiles?.email;
  if (!email) {
    return validationError({ email: 'Email address not found' }, 'Email address not found');
  }

    // Prepare email data
    const baseEmailData = {
      to: email,
      candidateName: platform.candidate_name,
      office: platform.office,
      level: platform.level as 'federal' | 'state' | 'local',
      state: platform.state,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/candidate/dashboard`,
      platformId: platform.id
    };

    const optionalData: Record<string, unknown> = {};
    if (platform.filing_deadline) {
      optionalData.filingDeadline = new Date(platform.filing_deadline);
      optionalData.daysUntilDeadline = Math.ceil(
        (new Date(platform.filing_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
    }

    const emailData = { ...baseEmailData, ...optionalData };

    // Send email
    const result = await sendCandidateJourneyEmail(type as EmailType, emailData as typeof baseEmailData & { filingDeadline?: Date; daysUntilDeadline?: number })

  if (!result.success) {
    return errorResponse(result.error ?? 'Failed to send email', 500);
  }

    // Update last reminder sent timestamp
    await supabase
      .from('candidate_platforms')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', platformId)

  return successResponse({
    message: 'Email sent successfully',
    emailType: type
  }, undefined, 201);
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  return handleJourneyEmailRequest(request);
});

/**
 * GET /api/candidates/journey/send-email?platformId=...&type=welcome
 * Test endpoint for sending emails
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const platformId = searchParams.get('platformId')
  const type = searchParams.get('type') ?? 'welcome'

  if (!platformId) {
    return validationError({ platformId: 'Platform ID required' });
  }

  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
      'user-agent': request.headers.get('user-agent') ?? ''
    }),
    body: JSON.stringify({ platformId, type, skipAuth: true })
  });

  return handleJourneyEmailRequest(mockRequest, { skipRateLimit: true });
});


