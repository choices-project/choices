import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { createRateLimiter, rateLimitMiddleware } from '@/lib/core/security/rate-limit';
import { sendTransactionalEmail } from '@/lib/integrations/email/resend';
import { verificationCodeTemplate } from '@/lib/integrations/email/templates';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const generateCode = () => {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
};

export const POST = withErrorHandling(async (_request: NextRequest) => {
  const limiter = createRateLimiter({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5,
    maxBurst: 3
  });
  const rate = await rateLimitMiddleware(_request, limiter);
  if (!rate.allowed) {
    return validationError({ rate: 'Too many requests. Please try later.' });
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return errorResponse('Authentication required', 401);

  const { data: candidate } = await supabase
    .from('candidate_profiles')
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!candidate) {
    return validationError({ _: 'Candidate onboarding not started' });
  }

  // Basic domain filter; rely on linking checks at confirm step
  const email = user.email;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('candidate_email_challenges')
    .insert({
      candidate_id: candidate.id,
      user_id: user.id,
      email,
      code,
      expires_at: expiresAt,
    });
  if (error) {
    return errorResponse('Failed to create challenge', 500);
  }

  const { subject, text, html } = verificationCodeTemplate(code);
  const send = await sendTransactionalEmail({ to: email, subject, text, html });
  if (!send.ok) {
    return errorResponse('Failed to send verification email', 502);
  }

  try {
    await (supabase as any)
      .from('platform_analytics')
      .insert({
        event_type: 'candidate_verify_code_sent',
        metadata: { candidateId: candidate.id, email: email.split('@')[1] },
      });
  } catch {
    // Ignore analytics failures; verification code email already sent
  }

  return successResponse({ ok: true });
});

