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

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';

import { withErrorHandling, authError, forbiddenError, errorResponse, validationError, successResponse } from '@/lib/api';
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
      .select('*')
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

    // Get current request origin
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    const currentOrigin = origin.replace(/\/$/, '');

    // SECURITY: Validate origin against allowed origins
    if (currentOrigin && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn registration attempt from unauthorized origin', {
        origin: currentOrigin,
        allowedOrigins,
        userId: user.id
      });
      return forbiddenError('Unauthorized origin');
    }

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: chal.challenge,
      expectedOrigin: allowedOrigins,
      expectedRPID: rpID,
    });

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
      logger.error('Failed to store credential', { error: credErr });
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

