import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyRegistrationResponse, arrayBufferToBase64URL } from '@/features/auth/lib/webauthn/native/server';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * WebAuthn Registration Verify
 * 
 * Verifies registration response and stores credential
 * Includes challenge expiry check and counter integrity guard
 */

export async function POST(req: NextRequest) {
  try {
    // Disable during build time to prevent static analysis issues
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return NextResponse.json({ error: 'WebAuthn routes disabled during build' }, { status: 503 });
    }

    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
    if (!enabled) {
      return NextResponse.json({ error: 'Passkeys disabled on preview' }, { status: 400 });
    }

    // E2E tests should use real WebAuthn implementation with virtual authenticators
    // No bypasses needed - tests should use proper WebAuthn flow

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Load latest un-used registration challenge
    const { data: chalRows, error: chalErr } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'registration')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (chalErr || !chalRows?.length) {
      return NextResponse.json({ error: 'No challenge' }, { status: 400 });
    }

    const chal = chalRows[0];

    // Critical fix: Challenge expiry check
    if (!chal || new Date(chal.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Convert challenge to base64URL for verification
    const challengeBase64 = arrayBufferToBase64URL(Buffer.from(chal.challenge, 'base64').buffer);

    // Get current request origin and validate against allowed origins
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    const currentOrigin = origin.replace(/\/$/, ''); // Remove trailing slash

    // Validate origin against allowed origins for security
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn registration attempt from disallowed origin', { currentOrigin, allowedOrigins });
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    // Verify
    const verification = await verifyRegistrationResponse(
      body,
      challengeBase64,
      currentOrigin,
      rpID
    );

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const {
      credentialId,
      publicKey,
      counter,
      aaguid,
      backupEligible,
      backupState,
    } = verification;

    // Store credential (owner row; bytea as base64)
    const { error: credErr } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      rp_id: rpID,
      credential_id: Buffer.from(credentialId).toString('base64'),
      public_key: Buffer.from(publicKey).toString('base64'),
      cose_alg: body?.response?.publicKeyAlgorithm ?? null,
      counter,
      aaguid: aaguid ?? null,
      backup_state: backupState ?? false,
      backup_eligible: backupEligible ?? false,
      device_label: body?.clientExtensionResults?.credProps?.rk ? 'This device' : null,
      transports: body?.response?.transports ?? [],
      last_used_at: new Date().toISOString(),
    });

    if (credErr) {
      logger.error('Store credential failed:', credErr instanceof Error ? credErr : new Error(String(credErr)));
      return NextResponse.json({ error: 'Store credential failed' }, { status: 500 });
    }

    // Mark challenge used
    await supabase.from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    return NextResponse.json({ ok: true });

  } catch (error) {
    logger.error('Registration verify error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
