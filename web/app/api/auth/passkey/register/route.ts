/**
 * WebAuthn Passkey Registration Route
 * 
 * Implements WebAuthn passkey registration using @simplewebauthn/server.
 * Supports both discoverable and non-discoverable credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateRegistrationOptions as generateRegistrationOptionsLib,
  verifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts
} from '@simplewebauthn/server';
import { devLog } from '@/lib/logger';
import { rateLimiters } from '@/lib/core/security/rate-limit';
import { requireUser } from '@/lib/core/auth/require-user';
import { validateOrigin } from '@/lib/http/origin';
import { 
  arrayBufferToBytea,
  base64urlToArrayBuffer,
  sanitizeCredentialId,
  logCredentialOperation,
  stringAaguidToBytea
} from '@/lib/webauthn/pg-bytea';
import { 
  handleWebAuthnError 
} from '@/lib/webauthn/error-handling';
import { 
  createWebAuthnRegistrationResponse 
} from '@/lib/webauthn/session-management';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

/**
 * POST /api/auth/passkey/register
 * 
 * Handles WebAuthn passkey registration:
 * 1. Generate registration options (challenge, user info, etc.)
 * 2. Verify registration response (attestation, public key, etc.)
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
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { credential, challenge, userId, username, displayName } = body;

    // If credential is provided, this is a verification request
    if (credential) {
      return await verifyRegistration(request, body);
    }

    // Otherwise, this is a request for registration options
    return await generateRegistrationOptions(request, body);

  } catch (error) {
    devLog('WebAuthn registration error:', error);
    
    // Use standardized WebAuthn error handling
    const errorResponse = handleWebAuthnError(error);
    return NextResponse.json(
      { error: errorResponse.userMessage },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * Generate registration options for WebAuthn
 */
async function generateRegistrationOptions(request: NextRequest, body: any): Promise<NextResponse> {
  const { userId, username, displayName } = body;

  if (!userId || !username) {
    return NextResponse.json(
      { error: 'User ID and username are required' },
      { status: 400 }
    );
  }

  // Verify user exists and is authenticated
  const userResult = await requireUser(request, { requireOrigin: false });
  if ('error' in userResult) {
    return NextResponse.json(
      { error: userResult.error },
      { status: userResult.status }
    );
  }

  if (userResult.user.id !== userId) {
    return NextResponse.json(
      { error: 'User ID mismatch' },
      { status: 403 }
    );
  }

  const supabase = userResult.supabase;

  // Get existing credentials for this user
  const { data: existingCredentials, error: credentialsError } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', userId);

  if (credentialsError) {
    devLog('Error fetching existing credentials:', credentialsError);
    return NextResponse.json(
      { error: 'Failed to fetch existing credentials' },
      { status: 500 }
    );
  }

  // Prepare existing credentials for exclusion
  const excludeCredentials = existingCredentials?.map((cred: any) => ({
    id: cred.credential_id,
    type: 'public-key' as const,
    transports: cred.transports || []
  })) || [];

  // Get origin and RP ID
  const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost';
  const rpID = new URL(origin).hostname;

  // Generate registration options
  const options: GenerateRegistrationOptionsOpts = {
    rpName: 'Choices Platform',
    rpID: rpID,
    userID: new Uint8Array(base64urlToArrayBuffer(userId)),
    userName: username,
    userDisplayName: displayName || username,
    attestationType: 'direct',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      residentKey: 'preferred'
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    excludeCredentials,
    timeout: 60000,
  };

  try {
    const optionsResponse = await generateRegistrationOptionsLib(options);

    // Store challenge in database for verification
    const { error: challengeError } = await supabase
      .from('webauthn_challenges')
      .insert({
        challenge: optionsResponse.challenge,
        user_id: userId,
        type: 'registration',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    if (challengeError) {
      devLog('Error storing challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to store challenge' },
        { status: 500 }
      );
    }

    devLog('Generated registration options for user:', userId);

    return NextResponse.json({
      success: true,
      ...optionsResponse
    });

  } catch (error) {
    devLog('Error generating registration options:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}

/**
 * Verify registration response
 */
async function verifyRegistration(request: NextRequest, body: any) {
  const { credential, challenge, userId } = body;

  if (!credential || !challenge || !userId) {
    return NextResponse.json(
      { error: 'Missing credential, challenge, or user ID' },
      { status: 400 }
    );
  }

  // Verify user exists and is authenticated
  const userResult = await requireUser(request, { requireOrigin: false });
  if ('error' in userResult) {
    return NextResponse.json(
      { error: userResult.error },
      { status: userResult.status }
    );
  }

  if (userResult.user.id !== userId) {
    return NextResponse.json(
      { error: 'User ID mismatch' },
      { status: 403 }
    );
  }

  const supabase = userResult.supabase;

  // Get and validate challenge
  const { data: challengeData, error: challengeError } = await supabase
    .from('webauthn_challenges')
    .select('challenge, expires_at')
    .eq('challenge', challenge)
    .eq('user_id', userId)
    .eq('type', 'registration')
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

  // Get origin and RP ID
  const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost';
  const rpID = new URL(origin).hostname;

  // Verify registration response
  const verificationOptions: VerifyRegistrationResponseOpts = {
    response: credential,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  };

  try {
    const verification = await verifyRegistrationResponse(verificationOptions);

    if (!verification.verified) {
      logCredentialOperation('create', credential.id, userId, new Error('Verification failed'));
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 400 }
      );
    }

    // Store the credential
    const credentialData = {
      credential_id: sanitizeCredentialId(credential.id),
      user_id: userId,
      public_key: arrayBufferToBytea(verification.registrationInfo.credential.publicKey.buffer),
      counter: verification.registrationInfo.credential.counter,
      transports: credential.response.transports || [],
      backup_eligible: false,
      backup_state: false,
      aaguid: verification.registrationInfo.aaguid ? stringAaguidToBytea(verification.registrationInfo.aaguid) : null,
      user_handle: null, // userHandle is not available in registrationInfo, it's in the credential
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('webauthn_credentials')
      .insert(credentialData);

    if (insertError) {
      devLog('Error storing WebAuthn credential:', insertError);
      logCredentialOperation('create', credential.id, userId, insertError);
      return NextResponse.json(
        { error: 'Failed to store passkey credential' },
        { status: 500 }
      );
    }

    // Clean up used challenge
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('challenge', challenge);

    logCredentialOperation('create', credential.id, userId);
    devLog('WebAuthn credential registered successfully for user:', userId);

    // Get user info for response
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', userId)
      .single();

    return createWebAuthnRegistrationResponse(
      userId,
      userProfile?.username || 'Unknown',
      credential.id
    );

  } catch (error) {
    devLog('Error verifying registration:', error);
    logCredentialOperation('create', credential.id, userId, error as Error);
    
    // Use standardized WebAuthn error handling
    const errorResponse = handleWebAuthnError(error);
    return NextResponse.json(
      { error: errorResponse.userMessage },
      { status: errorResponse.statusCode }
    );
  }
}
