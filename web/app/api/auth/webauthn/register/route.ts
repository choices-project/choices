import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { cookies as _cookies } from 'next/headers'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per hour per IP
    const rateLimitResult = await rateLimiters.biometric.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many biometric setup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Create Supabase client
    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get current user session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate a simple challenge for now
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const challengeBase64 = Buffer.from(challenge).toString('base64')

    // Store challenge in user's profile for verification
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        webauthn_challenge: challengeBase64,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', String(user.id) as any)

    if (updateError) {
      logger.error('Failed to store WebAuthn challenge:', updateError)
      return NextResponse.json(
        { message: 'Failed to setup biometric authentication' },
        { status: 500 }
      )
    }

    // Return basic WebAuthn options
    const options = {
      challenge: challengeBase64,
      rp: {
        name: 'Choices Platform',
        id: process.env.NEXT_PUBLIC_VERCEL_URL 
          ? process.env.NEXT_PUBLIC_VERCEL_URL.replace('https://', '') 
          : 'localhost',
      },
      user: {
        id: user.id,
        name: user.email || user.id,
        displayName: user.email || user.id,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
      },
    }

    return NextResponse.json({
      options,
    })

  } catch (error) {
    // narrow 'unknown' → Error
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('WebAuthn registration error:', err);
    
    return NextResponse.json(
      { message: 'Failed to setup biometric authentication' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get current user session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return NextResponse.json(
        { message: 'Credential data is required' },
        { status: 400 }
      )
    }

    // Get stored challenge
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('webauthn_challenge')
      .eq('user_id', String(user.id) as any)
      .single()

    if (profileError || !profile || !('webauthn_challenge' in profile) || !profile.webauthn_challenge) {
      return NextResponse.json(
        { message: 'No pending biometric setup found' },
        { status: 400 }
      )
    }

    // For now, just store the credential without full verification
    // In production, you'd want to properly verify the WebAuthn response
    const { error: credentialError } = await supabaseClient
      .from('webauthn_credentials')
      .insert({
        user_id: String(user.id) as any,
        credential_id: credential.id,
        public_key: 'stored_key', // In production, store the actual public key
        counter: 0,
        created_at: new Date().toISOString(),
      } as any)

    if (credentialError) {
      logger.error('Failed to store credential:', credentialError)
      return NextResponse.json(
        { message: 'Failed to save biometric credential' },
        { status: 500 }
      )
    }

    // Clear challenge
    await supabaseClient
      .from('user_profiles')
      .update({
        webauthn_challenge: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', String(user.id) as any)

    return NextResponse.json({
      message: 'Biometric authentication setup successful',
    })

  } catch (error) {
    // narrow 'unknown' → Error
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('WebAuthn verification error:', err);
    
    return NextResponse.json(
      { message: 'Failed to verify biometric setup' },
      { status: 500 }
    )
  }
}
