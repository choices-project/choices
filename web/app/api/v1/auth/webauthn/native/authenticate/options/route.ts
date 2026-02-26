/**
 * Native WebAuthn Authentication Options
 *
 * Generates authentication options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { generateAuthenticationOptions } from '@simplewebauthn/server';

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, successResponse, forbiddenError, errorResponse, rateLimitError } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

const WEBAUTHN_RATE_LIMIT = { maxRequests: 30, windowMs: 15 * 60 * 1000 };

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const isE2E = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '0';
  if (!isE2E) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    const result = await apiRateLimiter.checkLimit(ip, '/api/v1/auth/webauthn', WEBAUTHN_RATE_LIMIT);
    if (!result.allowed) {
      return rateLimitError('Too many passkey attempts. Please try again later.', result.retryAfter);
    }
  }

  const { enabled, rpID } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseAdminClient();
  const body = await req.json().catch(() => ({}));
  const userVerification = typeof body?.userVerification === 'string' ? body.userVerification : undefined;

  const options = await generateAuthenticationOptions({
    rpID: rpID,
    timeout: 60000,
    userVerification,
  });

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeBase64Url = options.challenge;

    const { data: challengeRow, error: chalErr } = await supabase
      .from('webauthn_challenges')
      .insert(
        stripUndefinedDeep({
          user_id: null,
      rp_id: rpID,
      kind: 'authentication',
      challenge: challengeBase64Url,
      expires_at: expiresAt,
        })
      )
      .select('id')
      .single();

    if (chalErr || !challengeRow?.id) {
      logger.error('Challenge persist failed:', chalErr);
      return errorResponse('Challenge persist failed', 500, undefined, 'WEBAUTHN_CHALLENGE_PERSIST_FAILED');
    }

  return successResponse({
    challengeId: challengeRow.id,
    options,
  });
});
