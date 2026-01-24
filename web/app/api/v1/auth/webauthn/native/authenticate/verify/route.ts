/**
 * Native WebAuthn Authentication Verification
 *
 * Verifies authentication response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';
import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, normalizeRequestOrigin } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, forbiddenError, errorResponse, validationError, successResponse } from '@/lib/api';
import { WEBAUTHN_CHALLENGE_SELECT_COLUMNS, WEBAUTHN_CREDENTIAL_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
    // Disable during build time
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return errorResponse('WebAuthn routes disabled during build', 503);
    }

    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
    if (!enabled) {
      return validationError({ enabled: 'Passkeys disabled on preview' });
    }

    const body = await req.json();
    const challengeId = body?.challengeId as string | undefined;
    if (!challengeId) {
      return validationError({ challengeId: 'Challenge ID is required' });
    }
    if (!body?.id || typeof body.id !== 'string') {
      return validationError({ id: 'Credential ID is required' });
    }

    const supabase = await getSupabaseAdminClient();

    // Get challenge from database
    const { data: chalRows } = await supabase
      .from('webauthn_challenges')
      .select(WEBAUTHN_CHALLENGE_SELECT_COLUMNS)
      .eq('id', challengeId)
      .eq('kind', 'authentication')
      .is('used_at', null)
      .limit(1);

    if (!chalRows?.length) {
      return validationError({ challenge: 'No challenge found' });
    }

    const chal = chalRows[0];
    if (!chal) {
      return validationError({ challenge: 'Challenge not found' });
    }

    // Check challenge expiry
    if (new Date(chal.expires_at).getTime() < Date.now()) {
      return validationError({ challenge: 'Challenge expired' });
    }
    if (chal.rp_id && chal.rp_id !== rpID) {
      return forbiddenError('Invalid relying party');
    }

    // Get current request origin (scheme + host + port); use Origin or parse Referer
    const currentOrigin = normalizeRequestOrigin(req);
    if (!currentOrigin) {
      logger.warn('WebAuthn verify with no Origin/Referer', { challengeId });
    }
    // SECURITY: Validate origin against allowed origins
    if (currentOrigin && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn authentication attempt from unauthorized origin', {
        origin: currentOrigin,
        allowedOrigins,
        challengeId
      });
      return forbiddenError('Unauthorized origin');
    }

    const expectedOrigin = currentOrigin || allowedOrigins[0];
    if (!expectedOrigin) {
      logger.warn('WebAuthn auth verify: no origin available', { challengeId });
      return forbiddenError('Origin required for verification');
    }

    // Lookup credential
    const { data: creds, error: credsErr } = await supabase
      .from('webauthn_credentials')
      .select(WEBAUTHN_CREDENTIAL_SELECT_COLUMNS)
      .eq('rp_id', rpID)
      .eq('credential_id', body.id)
      .limit(1);

    if (credsErr || !creds?.length) {
      return validationError({ credential: 'Unknown credential' });
    }

    const cred = creds[0];
    if (!cred) {
      return validationError({ credential: 'Credential not found' });
    }

    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: chal.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: isoBase64URL.toBuffer(cred.public_key),
        counter: Number(cred.counter ?? 0),
      },
    });

    if (!verified || !authenticationInfo) {
      return validationError({
        verification: 'Authentication verification failed',
      });
    }

    const newCounter = authenticationInfo.newCounter ?? 0;

    // Security check: Counter should never decrease
    if (newCounter < Number(cred.counter)) {
      logger.warn('Suspicious counter decrease detected', {
        credentialId: cred.id,
        oldCounter: cred.counter,
        newCounter
      });
      return validationError({ counter: 'Counter anomaly detected' });
    }

    // Update counter
    await supabase
      .from('webauthn_credentials')
      .update({ counter: newCounter, last_used_at: new Date().toISOString() })
      .eq('id', cred.id);

    // Mark challenge as used
    await supabase
      .from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    const { data: adminUser, error: adminUserError } = await supabase.auth.admin.getUserById(
      cred.user_id
    );
    if (adminUserError || !adminUser?.user) {
      return errorResponse('Failed to load user for session', 500, undefined, 'WEBAUTHN_USER_LOOKUP_FAILED');
    }
    if (!adminUser.user.email) {
      return errorResponse('User email missing for session creation', 500, undefined, 'WEBAUTHN_USER_EMAIL_MISSING');
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.user.email,
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      logger.error('Failed to generate login link for passkey session', { error: linkError });
      return errorResponse('Failed to establish session', 500, undefined, 'WEBAUTHN_SESSION_LINK_FAILED');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });
    if (sessionError || !sessionData?.session) {
      logger.error('Failed to verify login link for passkey session', { error: sessionError });
      return errorResponse('Failed to establish session', 500, undefined, 'WEBAUTHN_SESSION_VERIFY_FAILED');
    }

    logger.info('WebAuthn authentication verified', { userId: cred.user_id });

    const response = successResponse({
      verified: true,
      credential: {
        id: cred.credential_id,
        counter: newCounter
      },
      session: sessionData.session,
    });
    const apiClient = await getSupabaseApiRouteClient(req, response);
    await apiClient.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
    response.headers.set('cache-control', 'no-store');
    return response;
});

