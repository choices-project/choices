/**
 * Native WebAuthn Registration Verification
 *
 * Verifies registration response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { getRPIDAndOrigins, normalizeRequestOrigin } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, authError, forbiddenError, errorResponse, validationError, successResponse } from '@/lib/api';
import { WEBAUTHN_CHALLENGE_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { normalizeTrustTier } from '@/lib/trust/trust-tiers';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return errorResponse('WebAuthn routes disabled during build', 503);
  }

  const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return authError('Authentication required');
  }

    const body = await req.json();

    // Get challenge from database
    const { data: chalRows } = await supabase
      .from('webauthn_challenges')
      .select(WEBAUTHN_CHALLENGE_SELECT_COLUMNS)
      .eq('user_id', user.id)
      .eq('kind', 'registration')
      .is('used_at', null)
      .order('created_at', { ascending: false })
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

    // Get current request origin (scheme + host + port); use Origin or parse Referer
    const currentOrigin = normalizeRequestOrigin(req);
    if (!currentOrigin) {
      logger.warn('WebAuthn verify with no Origin/Referer', { userId: user.id });
    }
    // SECURITY: Validate origin against allowed origins
    if (currentOrigin && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn registration attempt from unauthorized origin', {
        origin: currentOrigin,
        allowedOrigins,
        userId: user.id
      });
      return forbiddenError('Unauthorized origin');
    }

    const expectedOrigin = currentOrigin || allowedOrigins[0];
    if (!expectedOrigin) {
      logger.warn('WebAuthn verify: no origin available', { userId: user.id });
      return forbiddenError('Origin required for verification');
    }

    let verified: boolean;
    let registrationInfo: Awaited<ReturnType<typeof verifyRegistrationResponse>>['registrationInfo'];
    try {
      const result = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: chal.challenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
      verified = result.verified;
      registrationInfo = result.registrationInfo;
    } catch (err) {
      logger.warn('WebAuthn verifyRegistrationResponse threw', {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
      return validationError({
        verification: 'Registration verification failed. Please try again.',
      });
    }

    if (!verified || !registrationInfo) {
      return validationError({
        verification: 'Registration verification failed',
      });
    }

    const credentialId = registrationInfo.credential.id;
    const publicKey = isoBase64URL.fromBuffer(registrationInfo.credential.publicKey);
    const transports = Array.isArray(body?.response?.transports) ? body.response.transports : undefined;
    const metadata = stripUndefinedDeep({
      transports,
      deviceType: registrationInfo.credentialDeviceType,
      backedUp: registrationInfo.credentialBackedUp,
    });

    // Store credential
    const { error: credErr } = await supabase.from('webauthn_credentials').insert(
      stripUndefinedDeep({
        user_id: user.id,
        rp_id: rpID,
        credential_id: credentialId,
        public_key: publicKey,
        counter: registrationInfo.credential.counter,
        metadata,
        created_at: new Date().toISOString(),
      })
    );

    if (credErr) {
      logger.error('Failed to store credential', {
        error: credErr,
        code: credErr.code,
        message: credErr.message,
        details: credErr.details,
        userId: user.id,
      });
      if (credErr.code === '23505') {
        return validationError({
          credential: 'This passkey is already registered. Try signing in with it instead.',
        });
      }
      return errorResponse('Failed to store credential', 500, undefined, 'WEBAUTHN_CREDENTIAL_STORE_FAILED');
    }

    // Mark challenge as used
    if (chal) {
      await supabase
        .from('webauthn_challenges')
        .update(stripUndefinedDeep({ used_at: new Date().toISOString() }))
        .eq('id', chal.id);
    }

    // Upgrade trust tier to T2 (proof-of-personhood) if applicable
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trust_tier')
      .eq('user_id', user.id)
      .single();

    const currentTier = normalizeTrustTier(profile?.trust_tier ?? 'T0');
    const tierRank: Record<string, number> = { T0: 0, T1: 1, T2: 2, T3: 3, T4: 4 };
    const targetRank = tierRank['T2'] ?? 2;
    if (profile && tierRank[currentTier] !== undefined && tierRank[currentTier] < targetRank) {
      await supabase
        .from('user_profiles')
        .update(stripUndefinedDeep({
          trust_tier: 'T2',
          trust_tier_upgrade_date: new Date().toISOString(),
        }))
        .eq('user_id', user.id);
    }

    logger.info('WebAuthn registration verified', { userId: user.id });

    return successResponse({
      verified: true,
      credential: {
        id: credentialId,
        publicKey
      },
      trustTier: 'T2'
    });
});

