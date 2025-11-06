import crypto from 'crypto';

import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getRPIDAndOrigins } from '@/lib/webauthn/config';
import { verifyCredentialRegistration } from '@/lib/webauthn/credential-verification';
import { arrayBufferToBase64url } from '@/lib/webauthn/type-converters';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

// POST - Handle WebAuthn registration (both getting options and verifying)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If credential is provided, this is a verification request
    if (body.credential) {
      return await verifyRegistration(body, request)
    }
    
    // Otherwise, this is a request for registration options
    return await getRegistrationOptions(body)
    
  } catch (error) {
    devLog('WebAuthn registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getRegistrationOptions(body: any) {
  try {
    const { userId, username } = body

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'User ID and username are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Verify user exists in auth.users
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      devLog('User not found for WebAuthn registration:', userId)
      return NextResponse.json(
        { error: 'User not found or user ID mismatch' },
        { status: 404 }
      )
    }

    // Generate registration options
    const challenge = crypto.randomBytes(32)
    const challengeBase64 = challenge.toString('base64')

    const userHandle = crypto.randomBytes(16)
    const userHandleBase64 = userHandle.toString('base64')

    const registrationOptions = {
      challenge: challengeBase64,
      rp: {
        name: 'Choices Platform',
        id: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') ?? 'localhost'
      },
      user: {
        id: userHandleBase64,
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false
      },
      excludeCredentials: [] // No existing credentials to exclude for new registration
    }

    // Store challenge and user handle for verification
    // In a real implementation, you'd store this in a session or cache
    // For now, we'll return it and verify it in the same request

    return NextResponse.json({
      success: true,
      ...registrationOptions
    })

  } catch (error) {
    devLog('Error getting registration options:', error)
    return NextResponse.json(
      { error: 'Failed to get registration options' },
      { status: 500 }
    )
  }
}

async function verifyRegistration(body: any, request: NextRequest) {
  try {
    const { credential, challenge, userId } = body

    if (!credential || !challenge || !userId) {
      return NextResponse.json(
        { error: 'Missing credential, challenge, or user ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Verify user exists in auth.users
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      devLog('User not found for WebAuthn registration verification:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Implement proper WebAuthn attestation verification
    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(request);
    
    if (!enabled) {
      return NextResponse.json(
        { error: 'WebAuthn is not enabled' },
        { status: 503 }
      );
    }

    // Get expected origin from request
    const origin = request.headers.get('origin') ?? request.headers.get('referer') ?? '';
    if (!origin || !allowedOrigins.includes(new URL(origin).origin)) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Verify the registration response using proper attestation verification
    const registrationResponse = credential as unknown as RegistrationResponseJSON;
    const verificationResult = await verifyCredentialRegistration(
      registrationResponse,
      challenge,
      origin,
      rpID
    );

    if (!verificationResult.verified) {
      devLog('WebAuthn attestation verification failed:', verificationResult.error);
      return NextResponse.json(
        { error: verificationResult.error ?? 'Attestation verification failed' },
        { status: 400 }
      );
    }

    // Convert public key to base64url string for storage (BYTEA column)
    const publicKeyBase64 = arrayBufferToBase64url(verificationResult.publicKey);
    
    // Convert credential data to store in database
    // Note: public_key is stored as BYTEA in PostgreSQL, but Supabase types expect string
    const credentialData = {
      credential_id: verificationResult.credentialId,
      user_id: userId,
      public_key: publicKeyBase64, // Store as base64url string (will be converted to BYTEA by PostgREST)
      counter: verificationResult.counter,
      rp_id: rpID,
      transports: verificationResult.transports ?? ['internal'],
      backup_eligible: verificationResult.backupEligible ?? false,
      backup_state: verificationResult.backupState ?? false
    };

    // Store the credential
    const { error: insertError } = await supabaseClient
      .from('webauthn_credentials')
      .insert(credentialData);

    if (insertError) {
      devLog('Error storing WebAuthn credential:', insertError);
      return NextResponse.json(
        { error: 'Failed to store biometric credential' },
        { status: 500 }
      );
    }

    devLog('WebAuthn credential registered successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Biometric credential registered successfully'
    })

  } catch (error) {
    devLog('Error verifying registration:', error)
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    )
  }
}
