/**
 * Native WebAuthn Registration Verification
 * 
 * Verifies registration response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import type { NextRequest } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyRegistrationResponse } from '@/features/auth/lib/webauthn/native/server';
import { withErrorHandling, authError, forbiddenError, errorResponse, validationError, successResponse } from '@/lib/api';
import { normalizeTrustTier } from '@/lib/trust/trust-tiers';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    // Verify registration using native implementation
    const verificationResult = await verifyRegistrationResponse(
      body,
      chal.challenge,
      currentOrigin,
      rpID
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

    // Use credential data from verification result
    const credentialId = verificationResult.credentialId;
    const publicKey = verificationResult.publicKey;

    // Convert ArrayBuffer to base64 for storage
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

    // Store credential
    const { error: credErr } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      rp_id: rpID,
      credential_id: credentialId,
      public_key: publicKeyBase64,
      counter: verificationResult.counter,
      transports: verificationResult.transports ?? [],
      backup_eligible: verificationResult.backupEligible ?? false,
      backup_state: verificationResult.backupState ?? false,
      created_at: new Date().toISOString()
    });

    if (credErr) {
      logger.error('Failed to store credential', { error: credErr });
      return errorResponse('Failed to store credential', 500, undefined, 'WEBAUTHN_CREDENTIAL_STORE_FAILED');
    }

    // Mark challenge as used
    if (chal) {
      await supabase
        .from('webauthn_challenges')
        .update({ used_at: new Date().toISOString() })
        .eq('id', chal.id);
    }

    // Upgrade trust tier to T2 (proof-of-personhood) if applicable
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trust_tier')
      .eq('user_id', user.id)
      .single();

    const currentTier = normalizeTrustTier(profile?.trust_tier ?? 'T0');
    const tierRank: Record<string, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };
    const targetRank = tierRank['T2'] ?? 2;
    if (profile && tierRank[currentTier] !== undefined && tierRank[currentTier] < targetRank) {
      await supabase
        .from('user_profiles')
        .update({
          trust_tier: 'T2',
          trust_tier_upgrade_date: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    logger.info('WebAuthn registration verified (native)', { userId: user.id });

    return successResponse({
      verified: true,
      credential: {
        id: credentialId,
        publicKey: publicKeyBase64
      },
      trustTier: 'T2'
    });
});

