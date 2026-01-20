/**
 * Native WebAuthn Registration Options
 *
 * Generates registration options using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import { generateRegistrationOptions } from '@simplewebauthn/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, successResponse, authError, forbiddenError, errorResponse } from '@/lib/api';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return errorResponse('WebAuthn routes disabled during build', 503);
  }

  const { enabled, rpID } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return authError('Authentication required');
  }

  const body = await req.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username : undefined;
  const displayName = typeof body?.displayName === 'string' ? body.displayName : undefined;
  const userVerification = typeof body?.userVerification === 'string' ? body.userVerification : undefined;
  const authenticatorAttachment =
    typeof body?.authenticatorAttachment === 'string' ? body.authenticatorAttachment : undefined;

  // Fetch existing credential IDs to exclude
  const { data: creds } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, metadata')
    .eq('user_id', user.id);

  const excludeCredentials = (creds ?? []).map((cred) => ({
    id: cred.credential_id,
  }));

  const options = await generateRegistrationOptions({
    rpName: 'Choices',
    rpID: rpID,
    userID: new TextEncoder().encode(user.id) as Uint8Array<ArrayBuffer>,
    userName: username ?? user.email ?? user.id,
    userDisplayName: displayName ?? user.email ?? user.id,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: stripUndefinedDeep({
      authenticatorAttachment,
      userVerification,
      residentKey: 'required',
    }),
    excludeCredentials,
  });

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeBase64Url = options.challenge;

    const { error: chalErr } = await supabase.from('webauthn_challenges').insert(stripUndefinedDeep({
      user_id: user.id,
      rp_id: rpID,
      kind: 'registration',
      challenge: challengeBase64Url,
      expires_at: expiresAt,
    }));

    if (chalErr) {
      logger.error('Challenge persist failed', { error: chalErr });
      return errorResponse('Challenge persist failed', 500, undefined, 'WEBAUTHN_CHALLENGE_PERSIST_FAILED');
    }

  logger.info('WebAuthn registration options generated', { userId: user.id });

  return successResponse(options);
});

