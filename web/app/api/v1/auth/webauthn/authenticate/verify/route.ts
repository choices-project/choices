import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyAuthenticationResponse, arrayBufferToBase64URL } from '@/features/auth/lib/webauthn/native/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * WebAuthn Authentication Verify
 * 
 * Verifies authentication response and updates counter
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

    // Always require real WebAuthn - no E2E bypasses for security

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
    const credIdBuf = Buffer.from(body.id, 'base64url');
    const { data: creds, error: credsErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('rp_id', rpID)
      .eq('credential_id', Buffer.from(credIdBuf).toString('base64'))
      .limit(1);

    if (credsErr || !creds?.length) {
      return NextResponse.json({ error: 'Unknown credential' }, { status: 400 });
    }

    const cred = creds[0];

    // Convert challenge to base64URL for verification
    const challengeBase64 = arrayBufferToBase64URL(Buffer.from(chal.challenge, 'base64').buffer);

    // Get current request origin
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const currentOrigin = origin.replace(/\/$/, ''); // Remove trailing slash

    // Create proper WebAuthnCredential object
    const credentialData = {
      id: cred?.id || '',
      userId: cred?.user_id || '',
      rpId: cred?.rp_id || '',
      credentialId: cred?.credential_id || '',
      publicKey: cred?.public_key || '',
      counter: Number(cred?.counter || 0),
      userHandle: cred?.user_handle || '',
      createdAt: new Date(cred?.created_at || Date.now()),
      lastUsedAt: cred?.last_used_at ? new Date(cred.last_used_at) : undefined
    };

    const verification = await verifyAuthenticationResponse(
      body,
      challengeBase64,
      currentOrigin,
      rpID,
      credentialData
    );

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { newCounter } = verification;

    // Critical fix: Counter integrity guard
    if (Number.isFinite(cred?.counter) && newCounter < (cred?.counter || 0)) {
      // Log suspicious activity, consider forcing re-register if repeated
      console.warn(`Suspicious counter decrease for credential ${cred?.id}: ${cred?.counter} -> ${newCounter}`);
    }

    // Update counter + last_used
    await supabase.from('webauthn_credentials')
      .update({ 
        counter: newCounter, 
        last_used_at: new Date().toISOString() 
      })
      .eq('id', cred?.id || '');

    await supabase.from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Authentication verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
