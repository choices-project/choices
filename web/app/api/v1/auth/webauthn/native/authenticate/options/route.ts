/**
 * Native WebAuthn Authentication Options
 *
 * Generates authentication options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { generateAuthenticationOptions } from '@simplewebauthn/server';

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, successResponse, forbiddenError, errorResponse } from '@/lib/api';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { enabled, rpID } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseAdminClient();
  const body = await req.json().catch(() => ({}));
  const userVerification = typeof body?.userVerification === 'string' ? body.userVerification : undefined;

  const options = generateAuthenticationOptions({
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
