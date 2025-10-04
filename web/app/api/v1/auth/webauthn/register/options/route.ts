import { type NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/lib/webauthn/config';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { base64urlToArrayBuffer } from '@/lib/webauthn/type-converters';

/**
 * WebAuthn Registration Options
 * 
 * Generates registration options for discoverable credentials
 * Privacy-first: attestation none, userVerification required
 */

export async function POST(req: NextRequest) {
  try {
    const { enabled, rpID } = getRPIDAndOrigins(req);
    if (!enabled) {
      return NextResponse.json({ error: 'Passkeys disabled on preview' }, { status: 400 });
    }

    // Always require real WebAuthn - no E2E bypasses for security

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch existing credential IDs to exclude
    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id);

    const excludeCredentials = (creds || []).map(c => ({
      id: c.credential_id,
      type: 'public-key' as const,
    }));

    // Discoverable only (resident key), UV required, platform preferred
    const options = await generateRegistrationOptions({
      rpName: 'Choices',
      rpID,
      userID: new Uint8Array(base64urlToArrayBuffer(user.id)),
      userName: user.email ?? user.id,
      attestationType: 'none', // Privacy-preserving
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform', // Smoothest UX
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      excludeCredentials,
    });

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'registration',
      challenge: Buffer.from(isoBase64URL.toBuffer(options.challenge)),
      expires_at: expiresAt,
    });

    if (chalErr) {
      console.error('Challenge persist failed:', chalErr);
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    return NextResponse.json(options);

  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
