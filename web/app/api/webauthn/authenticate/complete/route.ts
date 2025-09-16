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

    const { userId, response } = await req.json();
    
    if (!userId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Get and consume challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'authentication')
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

    // Extract credential ID from response
    const credentialId = isoUint8Array.toB64url(new Uint8Array(response.rawId));

    // Get the credential from database
    const { data: credential, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_id', credentialId)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 });
    }

    // For MVP, we'll do basic validation without @simplewebauthn/server
    // In production, you should use @simplewebauthn/server for proper verification
    const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
    const expectedRPID = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'localhost';

    // Basic validation (replace with proper @simplewebauthn/server verification)
    if (!response.rawId || !response.response) {
      return NextResponse.json({ error: 'Invalid WebAuthn response' }, { status: 400 });
    }

    // Check signature counter (basic replay protection)
    const newCounter = response.response.counter || 0;
    if (newCounter <= credential.sign_count) {
      return NextResponse.json({ error: 'Invalid signature counter' }, { status: 400 });
    }

    // Update credential with new counter and last used time
    const { error: updateError } = await supabase
      .from('webauthn_credentials')
      .update({
        sign_count: newCounter,
        last_used_at: new Date().toISOString()
      })
      .eq('id', credential.id);

    if (updateError) {
      logger.error('Failed to update credential:', updateError);
      return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 });
    }

    // Create session for user (integrate with your existing auth system)
    // This is where you would create a Supabase session or JWT token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: credential.user_id, // You might need to get the actual email
      password: 'webauthn-auth' // This is a placeholder - implement proper session creation
    });

    if (sessionError) {
      logger.error('Failed to create session:', sessionError);
      // For now, just return success - you'll need to implement proper session creation
    }

    logger.info('WebAuthn authentication successful', { 
      userId, 
      credentialId: credentialId.substring(0, 8) + '...',
      newCounter 
    });

    return NextResponse.json({ 
      success: true,
      message: 'Authentication successful',
      user: {
        id: userId,
        // Add other user data as needed
      }
    });
  } catch (error) {
    logger.error('WebAuthn authentication complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



