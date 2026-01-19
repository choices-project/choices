/**
 * Native WebAuthn Authentication Verification
 * 
 * Verifies authentication response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyAuthenticationResponse } from '@/features/auth/lib/webauthn/native/server';

import { withErrorHandling, forbiddenError, errorResponse, validationError, successResponse } from '@/lib/api';
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

    const supabase = await getSupabaseServerClient();

    // Get challenge from database
    const { data: chalRows } = await supabase
      .from('webauthn_challenges')
      .select('*')
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

    // Get current request origin
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    const currentOrigin = origin.replace(/\/$/, '');

    // SECURITY: Validate origin against allowed origins
    if (currentOrigin && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn authentication attempt from unauthorized origin', {
        origin: currentOrigin,
        allowedOrigins,
        challengeId
      });
      return forbiddenError('Unauthorized origin');
    }

    // Lookup credential
    const credIdBuf = Buffer.from(body.id, 'base64url');
    const { data: creds, error: credsErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('rp_id', rpID)
      .eq('credential_id', Buffer.from(credIdBuf).toString('base64'))
      .limit(1);

    if (credsErr || !creds?.length) {
      return validationError({ credential: 'Unknown credential' });
    }

    const cred = creds[0];
    if (!cred) {
      return validationError({ credential: 'Credential not found' });
    }

    const normalizeChallenge = (value: string) => {
      if (!value) return value;
      if (value.includes('+') || value.includes('/') || value.includes('=')) {
        return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      }
      return value;
    };

    // Verify authentication using native implementation
    const verificationResult = await verifyAuthenticationResponse(
      body,
      normalizeChallenge(chal.challenge),
      currentOrigin,
      rpID,
      {
        id: cred.id,
        credentialId: cred.credential_id,
        publicKey: cred.public_key,
        counter: Number(cred.counter),
        userId: cred.user_id,
        rpId: cred.rp_id ?? rpID,
        createdAt: new Date(cred.created_at ?? Date.now()),
        userHandle: cred.user_id
      }
    );

    if (!verificationResult.verified) {
      const errorMessage = verificationResult.error 
        ? typeof verificationResult.error === 'string' 
          ? verificationResult.error 
          : String(verificationResult.error)
        : 'Verification failed';
      return validationError({ 
        verification: errorMessage
      });
    }

    const newCounter = verificationResult.newCounter ?? 0;

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

    const adminClient = await getSupabaseAdminClient();
    const { data: adminUser, error: adminUserError } = await adminClient.auth.admin.getUserById(
      cred.user_id
    );
    if (adminUserError || !adminUser?.user) {
      return errorResponse('Failed to load user for session', 500, undefined, 'WEBAUTHN_USER_LOOKUP_FAILED');
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.user.email ?? '',
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      logger.error('Failed to generate login link for passkey session', { error: linkError });
      return errorResponse('Failed to establish session', 500, undefined, 'WEBAUTHN_SESSION_LINK_FAILED');
    }

    const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
      type: 'email',
      token_hash: linkData.properties.hashed_token,
    });
    if (sessionError || !sessionData?.session) {
      logger.error('Failed to verify login link for passkey session', { error: sessionError });
      return errorResponse('Failed to establish session', 500, undefined, 'WEBAUTHN_SESSION_VERIFY_FAILED');
    }

    logger.info('WebAuthn authentication verified (native)', { userId: cred.user_id });

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

