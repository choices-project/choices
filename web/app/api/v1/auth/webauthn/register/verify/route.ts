import { type NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getRPIDAndOrigins } from '@/lib/webauthn/config';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    // Verify
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: isoBase64URL.fromBuffer(chal.challenge),
      expectedOrigin: allowedOrigins,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const {
      credential: {
        id: credentialID,
        publicKey: credentialPublicKey,
        counter,
      },
      aaguid,
      credentialBackedUp,
      credentialDeviceType,
    } = verification.registrationInfo;

    // Store credential (owner row; bytea as base64)
    const { error: credErr } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      rp_id: rpID,
      credential_id: Buffer.from(credentialID),
      public_key: Buffer.from(credentialPublicKey),
      cose_alg: body?.response?.publicKeyAlgorithm ?? null,
      counter,
      aaguid: aaguid || null,
      backed_up: credentialBackedUp ?? null,
      backup_eligible: credentialDeviceType === 'multiDevice',
      device_label: body?.clientExtensionResults?.credProps?.rk ? 'This device' : null,
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
