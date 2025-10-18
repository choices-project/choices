/**
 * Native WebAuthn Authentication Verify
 * 
 * Verifies authentication response using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { 
  verifyAuthenticationResponse,
  arrayBufferToBase64URL,
  base64URLToArrayBuffer
} from '@/features/auth/lib/webauthn/native/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * WebAuthn Authentication Verify
 * 
 * Verifies authentication response and authenticates user
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

    // Load latest un-used authentication challenge
    const { data: chalRows, error: chalErr } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'authentication')
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

    // Get credential data for verification
    const { data: credRows, error: credErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('credential_id', Buffer.from(base64URLToArrayBuffer(body.id)))
      .limit(1);

    if (credErr || !credRows?.length) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 400 });
    }

    const credential = credRows[0];

    // Convert challenge to base64URL for verification
    const challengeBase64 = arrayBufferToBase64URL(chal.challenge);

    // Get current request origin
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const currentOrigin = origin.replace(/\/$/, ''); // Remove trailing slash

    // Verify using native implementation
    const verification = await verifyAuthenticationResponse(
      body,
      challengeBase64,
      currentOrigin,
      rpID,
      {
        id: credential.id,
        userId: credential.user_id,
        rpId: credential.rp_id,
        credentialId: arrayBufferToBase64URL(credential.credential_id),
        publicKey: arrayBufferToBase64URL(credential.public_key),
        counter: credential.counter,
        transports: credential.transports,
        backupEligible: credential.backup_eligible,
        backupState: credential.backed_up,
        aaguid: credential.aaguid ? arrayBufferToBase64URL(credential.aaguid) : undefined,
        userHandle: credential.user_handle ? arrayBufferToBase64URL(credential.user_handle) : undefined,
        createdAt: new Date(credential.created_at),
        lastUsedAt: credential.last_used_at ? new Date(credential.last_used_at) : undefined
      }
    );

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update credential counter
    const { error: updateErr } = await supabase
      .from('webauthn_credentials')
      .update({ 
        counter: verification.newCounter,
        last_used_at: new Date().toISOString()
      })
      .eq('id', credential.id);

    if (updateErr) {
      console.error('Update credential failed:', updateErr);
      return NextResponse.json({ error: 'Update credential failed' }, { status: 500 });
    }

    // Mark challenge used
    await supabase.from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Authentication verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
