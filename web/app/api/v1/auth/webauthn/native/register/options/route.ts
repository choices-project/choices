/**
 * Native WebAuthn Registration Options
 * 
 * Generates registration options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { 
  generateRegistrationOptions,
  arrayBufferToBase64URL
} from '@/features/auth/lib/webauthn/native/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

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

    const excludeCredentials = (creds || []).map(c => c.credential_id);

    // Generate native registration options
    const options = generateRegistrationOptions(
      user.id,
      user.email ?? user.id,
      user.email ?? user.id,
      rpID,
      'Choices',
      excludeCredentials
    );

    // Convert to base64URL for JSON response
    const challengeBase64 = arrayBufferToBase64URL(options.challenge);
    const userIdBase64 = arrayBufferToBase64URL(options.user.id);
    
    const responseOptions = {
      challenge: challengeBase64,
      rp: options.rp,
      user: {
        id: userIdBase64,
        name: options.user.name,
        displayName: options.user.displayName
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      excludeCredentials: options.excludeCredentials?.map(cred => ({
        id: arrayBufferToBase64URL(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      authenticatorSelection: options.authenticatorSelection,
      attestation: options.attestation
    };

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeArray = new Uint8Array(options.challenge);
    
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'registration',
      challenge: Buffer.from(challengeArray).toString('base64'),
      expires_at: expiresAt,
    });

    if (chalErr) {
      console.error('Challenge persist failed:', chalErr);
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    return NextResponse.json(responseOptions);

  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
