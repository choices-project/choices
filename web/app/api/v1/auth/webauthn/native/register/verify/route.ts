/**
 * Native WebAuthn Registration Verify
 * 
 * Verifies registration response using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { 
  verifyRegistrationResponse,
  arrayBufferToBase64URL,
  base64URLToArrayBuffer
} from '@/features/auth/lib/webauthn/native/server';
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
    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
    if (!enabled) {
      return NextResponse.json({ error: 'Passkeys disabled on preview' }, { status: 400 });
    }

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
    const challengeBase64 = arrayBufferToBase64URL(chal.challenge);

    // Get current request origin
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const currentOrigin = origin.replace(/\/$/, ''); // Remove trailing slash

    // Verify using native implementation
    const verification = await verifyRegistrationResponse(
      body,
      challengeBase64,
      currentOrigin,
      rpID
    );

    if (!verification.verified || !verification.credentialId) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Store credential (owner row; bytea as base64)
    const { error: credErr } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      rp_id: rpID,
      credential_id: Buffer.from(base64URLToArrayBuffer(verification.credentialId)),
      public_key: Buffer.from(verification.publicKey),
      cose_alg: -7, // ES256
      counter: verification.counter,
      aaguid: verification.aaguid ? Buffer.from(verification.aaguid, 'hex') : null,
      backed_up: verification.backupState ?? null,
      backup_eligible: verification.backupEligible ?? null,
      device_label: 'This device',
      device_info: { ua: req.headers.get('user-agent') ?? '' },
      last_used_at: new Date().toISOString(),
    });

    if (credErr) {
      console.error('Store credential failed:', credErr);
      return NextResponse.json({ error: 'Store credential failed' }, { status: 500 });
    }

    // Mark challenge used
    await supabase.from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Registration verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
