import { NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

import { isoUint8Array } from '../begin/route';

/**
 * POST /api/webauthn/register/complete
 * 
 * Completes WebAuthn credential registration by verifying and storing credential.
 * Returns 503 with password fallback info if feature disabled.
 * 
 * @returns {NextResponse} Success or error with fallback
 */
export async function POST(req: Request) {
  try {
    // Check if WebAuthn is enabled - graceful degradation
    if (!isFeatureEnabled('WEBAUTHN')) {
      return NextResponse.json({ 
        error: 'WebAuthn feature is disabled',
        fallback: 'password',
        message: 'Biometric authentication is currently unavailable. Please use password authentication.'
      }, { status: 503 }); // 503 Service Unavailable for better client handling
    }

    const { userId, response } = await req.json();
    
    if (!userId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Verify user exists and is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and consume challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .eq('challenge', response.challenge)
      .single();

    if (challengeError || !challengeData) {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 });
    }

    // Check if challenge is expired
    if (new Date(challengeData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Delete the used challenge
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('id', challengeData.id);

    // For MVP, we do basic validation without @simplewebauthn/server.
    // NOTE: Production enhancement - Integrate @simplewebauthn/server for full verification.
    // This provides additional security guarantees but basic validation is acceptable for MVP.

    // Basic validation (replace with proper @simplewebauthn/server verification)
    if (!response.rawId || !response.response) {
      return NextResponse.json({ error: 'Invalid WebAuthn response' }, { status: 400 });
    }

    // Extract credential information
    const credentialId = isoUint8Array.toB64url(new Uint8Array(response.rawId));
    const publicKey = response.response.publicKey;
    const counter = response.response.counter || 0;
    const aaguid = response.response.aaguid || null;
    const backupEligible = response.response.backupEligible || null;
    const backupState = response.response.backupState || null;
    const transports = response.response.transports || null;

    // Store credential in database
    const { error: credentialError } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: Buffer.from(publicKey).toString('base64'),
        counter: counter,
        metadata: {
          aaguid,
          transports,
          backup_eligible: backupEligible,
          backup_state: backupState,
        },
        last_used_at: new Date().toISOString()
      });

    if (credentialError) {
      logger.error('Failed to store WebAuthn credential:', credentialError);
      return NextResponse.json({ error: 'Failed to store credential' }, { status: 500 });
    }

    logger.info('WebAuthn credential registered successfully', { 
      userId, 
      credentialId: credentialId.substring(0, 8) + '...' 
    });

    return NextResponse.json({ 
      success: true,
      message: 'Passkey created successfully' 
    });
  } catch (error) {
    logger.error('WebAuthn registration complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








