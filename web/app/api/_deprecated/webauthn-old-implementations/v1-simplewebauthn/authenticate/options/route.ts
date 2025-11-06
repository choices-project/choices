import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { generateAuthenticationOptions } from '@/features/auth/lib/webauthn/native/server';
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
    // Disable during build time to prevent static analysis issues
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return NextResponse.json({ error: 'WebAuthn routes disabled during build' }, { status: 503 });
    }

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

    const options = generateAuthenticationOptions(
      rpID,
      [] // Discoverable only → smoother UX
    );

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeArray = new Uint8Array(options.challenge);
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'authentication',
      challenge: Buffer.from(challengeArray).toString('base64'),
      expires_at: expiresAt,
    });

    if (chalErr) {
      logger.error('Challenge persist failed:', chalErr);
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    return NextResponse.json(options);

  } catch (error) {
    logger.error('Authentication options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
