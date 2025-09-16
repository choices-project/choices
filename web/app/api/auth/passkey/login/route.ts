/**
 * WebAuthn Passkey Login Route
 * 
 * Implements WebAuthn passkey authentication using @simplewebauthn/server.
 * Supports both discoverable and non-discoverable credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts
} from '@simplewebauthn/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { rateLimiters } from '@/lib/core/security/rate-limit';
import { validateOrigin } from '@/lib/http/origin';
import { requireTurnstileVerification } from '@/lib/security/turnstile';
import { 
  byteaToArrayBuffer,
  base64urlToArrayBuffer,
  sanitizeCredentialId,
  logCredentialOperation
} from '@/lib/webauthn/pg-bytea';
import { 
  WebAuthnError, 
  WebAuthnErrorType, 
  handleWebAuthnError 
} from '@/lib/webauthn/error-handling';
import { 
  createWebAuthnAuthResponse,
  type WebAuthnSessionData 
} from '@/lib/webauthn/session-management';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

/**
 * POST /api/auth/passkey/login
 * 
 * Handles WebAuthn passkey authentication:
 * 1. Generate authentication options (challenge, allowCredentials, etc.)
 * 2. Verify authentication response (assertion, signature, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Origin validation
    const originValidation = validateOrigin(request);
    if (!originValidation.valid) {
      devLog('Origin validation failed:', originValidation);
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimiters.biometric.check(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { credential, challenge, username } = body;

    // If credential is provided, this is a verification request
    if (credential) {
      return await verifyAuthentication(request, body);
    }

    // Otherwise, this is a request for authentication options
    return await generateAuthOptionsHandler(request, body);

  } catch (error) {
    devLog('WebAuthn authentication error:', error);
    
    // Use standardized WebAuthn error handling
    const errorResponse = handleWebAuthnError(error);
    return NextResponse.json(
      { error: errorResponse.userMessage },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * Generate authentication options for WebAuthn
 */
async function generateAuthOptionsHandler(request: NextRequest, body: any) {
  const { username } = body;

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 500 }
    );
  }

  // Find user by username
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .eq('username', username)
    .single();

  if (userError || !user) {
    devLog('User not found for WebAuthn authentication:', username);
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get user's credentials
  const { data: credentials, error: credentialsError } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, transports, user_handle')
    .eq('user_id', user.user_id);

  if (credentialsError) {
    devLog('Error fetching credentials:', credentialsError);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }

  // Prepare allowCredentials
  const allowCredentials = credentials?.map(cred => ({
    id: cred.credential_id, // Keep as base64url string, not ArrayBuffer
    transports: cred.transports || []
  })) || [];

  // Get origin and RP ID
  const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost';
  const rpID = new URL(origin).hostname;

  // Generate authentication options
  const options: GenerateAuthenticationOptionsOpts = {
    rpID: rpID,
    allowCredentials,
    userVerification: 'preferred',
    timeout: 60000,
  };

  try {
    const optionsResponse = await generateAuthOptions(options);

    // Store challenge in database for verification
    const { error: challengeError } = await supabase
      .from('webauthn_challenges')
      .insert({
        challenge: optionsResponse.challenge,
        user_id: user.user_id,
        type: 'authentication',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    if (challengeError) {
      devLog('Error storing challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to store challenge' },
        { status: 500 }
      );
    }

    devLog('Generated authentication options for user:', user.user_id);

    return NextResponse.json({
      success: true,
      ...optionsResponse
    });

  } catch (error) {
    devLog('Error generating authentication options:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}

/**
 * Verify authentication response
 */
async function verifyAuthentication(request: NextRequest, body: any) {
  const { credential, challenge, username } = body;

  if (!credential || !challenge || !username) {
    return NextResponse.json(
      { error: 'Missing credential, challenge, or username' },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 500 }
    );
  }

  // Find user by username
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .eq('username', username)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get and validate challenge
  const { data: challengeData, error: challengeError } = await supabase
    .from('webauthn_challenges')
    .select('challenge, expires_at')
    .eq('challenge', challenge)
    .eq('user_id', user.user_id)
    .eq('type', 'authentication')
    .single();

  if (challengeError || !challengeData) {
    return NextResponse.json(
      { error: 'Invalid or expired challenge' },
      { status: 400 }
    );
  }

  // Check if challenge is expired
  if (new Date(challengeData.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Challenge expired' },
      { status: 400 }
    );
  }

  // Get credential from database
  const { data: credentialData, error: credentialError } = await supabase
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', sanitizeCredentialId(credential.id))
    .eq('user_id', user.user_id)
    .single();

  if (credentialError || !credentialData) {
    logCredentialOperation('read', credential.id, user.user_id, new Error('Credential not found'));
    return NextResponse.json(
      { error: 'Credential not found' },
      { status: 404 }
    );
  }

  // Get origin and RP ID
  const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost';
  const rpID = new URL(origin).hostname;

  // Verify authentication response
  const verificationOptions: VerifyAuthenticationResponseOpts = {
    response: credential,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credentialData.credential_id, // Keep as base64url string
      publicKey: new Uint8Array(byteaToArrayBuffer(credentialData.public_key)),
      counter: credentialData.counter,
      transports: credentialData.transports || []
    },
    requireUserVerification: true,
  };

  try {
    const verification = await verifyAuthenticationResponse(verificationOptions);

    if (!verification.verified) {
      logCredentialOperation('read', credential.id, user.user_id, new Error('Verification failed'));
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Update credential counter
    const { error: updateError } = await supabase
      .from('webauthn_credentials')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString()
      })
      .eq('credential_id', credentialData.credential_id);

    if (updateError) {
      devLog('Error updating credential counter:', updateError);
    }

    // Clean up used challenge
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('challenge', challenge);

    logCredentialOperation('read', credential.id, user.user_id);
    devLog('WebAuthn authentication successful for user:', user.user_id);

    // Create WebAuthn session data
    const sessionData: WebAuthnSessionData = {
      userId: user.user_id,
      username: user.username,
      credentialId: credential.id,
      authenticatedAt: new Date().toISOString(),
      method: 'webauthn',
      trustTier: 'T1', // Default trust tier, could be fetched from user profile
      isAdmin: false // Could be fetched from user profile
    };

    // Create and return the authentication response with session
    return createWebAuthnAuthResponse(sessionData, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

  } catch (error) {
    devLog('Error verifying authentication:', error);
    logCredentialOperation('read', credential.id, user.user_id, error as Error);
    
    // Use standardized WebAuthn error handling
    const errorResponse = handleWebAuthnError(error);
    return NextResponse.json(
      { error: errorResponse.userMessage },
      { status: errorResponse.statusCode }
    );
  }
}
