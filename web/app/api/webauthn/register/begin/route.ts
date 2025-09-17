import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/logger';

// Base64URL utilities
export const isoUint8Array = {
  fromString: (s: string) => new TextEncoder().encode(s),
  toB64url: (u8: Uint8Array) =>
    Buffer.from(u8).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
  fromB64url: (s: string) =>
    new Uint8Array(Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'), 'base64')),
};

export async function POST(req: Request) {
  try {
    // Check if WebAuthn is enabled
    if (!isFeatureEnabled('WEBAUTHN')) {
      return NextResponse.json({ error: 'WebAuthn feature is disabled' }, { status: 403 });
    }

    const { userId, username, displayName } = await req.json();
    
    if (!userId || !username || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user exists and is authenticated
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create challenge
    const challenge = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 120000); // 2 minutes

    // Store challenge in database
    const { error: challengeError } = await supabase
      .from('webauthn_challenges')
      .insert({
        user_id: userId,
        challenge,
        type: 'registration',
        expires_at: expiresAt.toISOString()
      });

    if (challengeError) {
      logger.error('Failed to store WebAuthn challenge:', challengeError);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    // WebAuthn options
    const rpId = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'localhost';
    const options = {
      rp: { 
        id: rpId, 
        name: 'Choices' 
      },
      user: {
        id: isoUint8Array.fromString(userId),
        name: username,
        displayName,
      },
      challenge: isoUint8Array.fromString(challenge),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256 (fallback)
      ],
      timeout: 60000,
      attestation: 'none', // Privacy-first: no attestation
      authenticatorSelection: {
        residentKey: 'preferred',      // discoverable creds if platform supports
        userVerification: 'required',  // Force biometric verification
        authenticatorAttachment: 'platform', // prefer device biometrics first
      },
      extensions: { credProps: true }
    } as const;

    logger.info('WebAuthn registration challenge created', { userId, challenge: challenge.substring(0, 8) + '...' });

    return NextResponse.json(options);
  } catch (error) {
    logger.error('WebAuthn registration begin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





