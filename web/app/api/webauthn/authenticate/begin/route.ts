import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/logger';
import { isoUint8Array } from '../../register/begin/route';

export async function POST(req: Request) {
  try {
    // Check if WebAuthn is enabled
    if (!isFeatureEnabled('WEBAUTHN')) {
      return NextResponse.json({ error: 'WebAuthn feature is disabled' }, { status: 403 });
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Get user's credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('user_id', userId);

    if (credentialsError) {
      logger.error('Failed to fetch user credentials:', credentialsError);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    if (!credentials || credentials.length === 0) {
      return NextResponse.json({ error: 'No passkeys found for user' }, { status: 404 });
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
        type: 'authentication',
        expires_at: expiresAt.toISOString()
      });

    if (challengeError) {
      logger.error('Failed to store WebAuthn challenge:', challengeError);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    // Prepare allowCredentials
    const allowCredentials = credentials.map(cred => ({
      id: isoUint8Array.fromB64url(cred.credential_id),
      type: 'public-key',
      transports: cred.transports || undefined,
    }));

    const rpId = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'localhost';

    const options = {
      challenge: isoUint8Array.fromString(challenge),
      timeout: 60000,
      rpId,
      userVerification: 'required', // Force biometric verification
      allowCredentials,
    };

    logger.info('WebAuthn authentication challenge created', { 
      userId, 
      challenge: challenge.substring(0, 8) + '...',
      credentialCount: credentials.length 
    });

    return NextResponse.json(options);
  } catch (error) {
    logger.error('WebAuthn authentication begin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



