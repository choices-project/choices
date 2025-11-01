// Native WebAuthn implementation to avoid decorator issues
import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { generateRegistrationOptions } from '@/features/auth/lib/webauthn/native/server';
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
    // Disable during build time to prevent static analysis issues
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return NextResponse.json({ error: 'WebAuthn routes disabled during build' }, { status: 503 });
    }

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

    // Use native implementation
    const options = generateRegistrationOptions(
      user.id,
      user.email ?? user.id,
      user.email ?? user.id,
      rpID,
      'Choices',
      excludeCredentials.map(c => c.id)
    );

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

    return NextResponse.json(options);

  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
