import { type NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    // E2E tests should use real WebAuthn implementation with virtual authenticators
    // No bypasses needed - tests should use proper WebAuthn flow

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: [], // Discoverable only → smoother UX
    });

    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'authentication',
      challenge: Buffer.from(isoBase64URL.toBuffer(options.challenge)),
      expires_at: expiresAt,
    });

    if (chalErr) {
      console.error('Challenge persist failed:', chalErr);
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    return NextResponse.json(options);

  } catch (error) {
    console.error('Authentication options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
