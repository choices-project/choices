/**
 * Native WebAuthn Authentication Options
 * 
 * Generates authentication options using native WebAuthn API
 * Replaces @simplewebauthn/server with native implementation
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { 
  generateAuthenticationOptions,
  arrayBufferToBase64URL
} from '@/features/auth/lib/webauthn/native/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * WebAuthn Authentication Options
 * 
 * Generates authentication options for discoverable credentials
 * Username-less UX with userVerification required
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

    // Generate native authentication options
    const options = generateAuthenticationOptions(rpID);

    // Convert to base64URL for JSON response
    const challengeBase64 = arrayBufferToBase64URL(options.challenge);
    
    const responseOptions = {
      challenge: challengeBase64,
      timeout: options.timeout,
      rpId: options.rpId,
      userVerification: options.userVerification,
      allowCredentials: options.allowCredentials?.map(cred => ({
        id: arrayBufferToBase64URL(cred.id),
        type: cred.type,
        transports: cred.transports
      }))
    };

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeArray = new Uint8Array(options.challenge);
    
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'authentication',
      challenge: Buffer.from(challengeArray),
      expires_at: expiresAt,
    });

    if (chalErr) {
      console.error('Challenge persist failed:', chalErr);
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    return NextResponse.json(responseOptions);

  } catch (error) {
    console.error('Authentication options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
