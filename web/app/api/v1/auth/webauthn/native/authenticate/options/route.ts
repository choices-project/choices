/**
 * Native WebAuthn Authentication Options
 * 
 * Generates authentication options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import {
  arrayBufferToBase64URL,
  generateAuthenticationOptions,
} from '@/features/auth/lib/webauthn/native/server';

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

    // Generate native authentication options
    const options = generateAuthenticationOptions(rpID);

    // Convert to base64URL for JSON response
    const challengeBase64 = arrayBufferToBase64URL(options.challenge);
    
    const responseOptions = {
      challenge: challengeBase64,
      timeout: options.timeout,
      rpId: options.rpId,
      userVerification: options.userVerification,
      ...(options.allowCredentials && options.allowCredentials.length > 0
        ? {
            allowCredentials: options.allowCredentials.map((cred) => ({
              id: arrayBufferToBase64URL(cred.id),
              type: cred.type,
              transports: cred.transports,
            })),
          }
        : {}),
    };

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeBase64Url = arrayBufferToBase64URL(options.challenge);
    
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
    options: responseOptions,
  });
});
