import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getRPIDAndOrigins } from '@/lib/webauthn/config';
import { getSupabaseServerClient } from '@/utils/supabase/server';

/**
 * WebAuthn Authentication Verify
 * 
 * Verifies authentication response and updates counter
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

    const { data: chalRows } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'authentication')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!chalRows?.length) {
      return NextResponse.json({ error: 'No challenge' }, { status: 400 });
    }

    const chal = chalRows[0];

    // Critical fix: Challenge expiry check
    if (!chal || new Date(chal.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Lookup authenticator by credentialId presented
    const credIdBuf = isoBase64URL.toBuffer(body.id);
    const { data: creds, error: credsErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('rp_id', rpID)
      .eq('credential_id', credIdBuf)
      .limit(1);

    if (credsErr || !creds?.length) {
      return NextResponse.json({ error: 'Unknown credential' }, { status: 400 });
    }

    const cred = creds[0];

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: isoBase64URL.fromBuffer(chal.challenge),
      expectedOrigin: allowedOrigins,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: Buffer.from(cred.credential_id).buffer,
        publicKey: Buffer.from(cred.public_key).buffer,
        counter: Number(cred.counter),
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { newCounter } = verification.authenticationInfo;

    // Critical fix: Counter integrity guard
    if (Number.isFinite(cred.counter) && newCounter < cred.counter) {
      // Log suspicious activity, consider forcing re-register if repeated
      console.warn(`Suspicious counter decrease for credential ${cred.id}: ${cred.counter} -> ${newCounter}`);
    }

    // Update counter + last_used
    await supabase.from('webauthn_credentials')
      .update({ 
        counter: newCounter, 
        last_used_at: new Date().toISOString() 
      })
      .eq('id', cred.id);

    await supabase.from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Authentication verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
