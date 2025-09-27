import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic'

// POST - Handle WebAuthn registration (both getting options and verifying)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If credential is provided, this is a verification request
    if (body.credential) {
      return await verifyRegistration(body)
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

    // Verify user exists
    const { data: user, error: userError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, email')
      .eq('stable_id', userId)
      .single()

    if (userError || !user) {
      devLog('User not found for WebAuthn registration:', userId)
      return NextResponse.json(
        { error: 'User not found' },
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
        id: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost'
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

async function verifyRegistration(body: any) {
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

    // Verify user exists
    const { data: user, error: userError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, email')
      .eq('stable_id', userId)
      .single()

    if (userError || !user) {
      devLog('User not found for WebAuthn registration verification:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // TODO: Implement proper WebAuthn attestation verification
    // This would involve:
    // 1. Verifying the challenge matches
    // 2. Verifying the attestation statement
    // 3. Extracting the public key
    // 4. Storing the credential securely
    
    // For now, we'll extract basic information and store it
    const attestationResponse = credential.response as AuthenticatorAttestationResponse
    
    // Convert credential data to store in database
    const credentialData = {
      credential_id: credential.id,
      user_id: userId,
      public_key: Buffer.from(attestationResponse.attestationObject), // This should be the actual public key
      counter: 0,
      rp_id: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost',
      transports: ['internal'], // Default to internal
      backup_eligible: false,
      backup_state: false
    }

    // Store the credential
    const { error: insertError } = await supabaseClient
      .from('webauthn_credentials')
      .insert(credentialData)

    if (insertError) {
      devLog('Error storing WebAuthn credential:', insertError)
      return NextResponse.json(
        { error: 'Failed to store biometric credential' },
        { status: 500 }
      )
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
