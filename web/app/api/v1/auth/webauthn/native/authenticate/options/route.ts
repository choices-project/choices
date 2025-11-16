/**
 * Native WebAuthn Authentication Options
 * 
 * Generates authentication options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import type { NextRequest } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { 
  generateAuthenticationOptions,
  arrayBufferToBase64URL
} from '@/features/auth/lib/webauthn/native/server';
import { withErrorHandling, successResponse, authError, forbiddenError, errorResponse } from '@/lib/api';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { enabled, rpID } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return authError('Authentication required');
  }

    // Generate native authentication options
    const options = generateAuthenticationOptions(rpID);

    // Convert to base64URL for JSON response
    const challengeBase64 = arrayBufferToBase64URL(options.challenge);
    
    const responseOptions = {
      challenge: challengeBase64,
      timeout: options.timeout,
      rpId: options.rpId,
      userVerification: options.userVerification,
      allowCredentials: options.allowCredentials?.map(cred => ({
        id: arrayBufferToBase64URL(cred.id),
        type: cred.type,
        transports: cred.transports
      }))
    };

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeArray = new Uint8Array(options.challenge);
    
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert(stripUndefinedDeep({
      user_id: user.id,
      rp_id: rpID,
      kind: 'authentication',
      challenge: Buffer.from(challengeArray).toString('base64'),
      expires_at: expiresAt,
    }));

    if (chalErr) {
      logger.error('Challenge persist failed:', chalErr);
      return errorResponse('Challenge persist failed', 500, undefined, 'WEBAUTHN_CHALLENGE_PERSIST_FAILED');
    }

  return successResponse(responseOptions);
});
