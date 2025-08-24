import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 10 attempts per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await limiter.check(10, ip)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Too many biometric setup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        webauthn_challenge: challengeBase64,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to store WebAuthn challenge:', updateError)
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
    console.error('WebAuthn registration error:', error)
    
    return NextResponse.json(
      { message: 'Failed to setup biometric authentication' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('webauthn_challenge')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.webauthn_challenge) {
      return NextResponse.json(
        { message: 'No pending biometric setup found' },
        { status: 400 }
      )
    }

    // For now, just store the credential without full verification
    // In production, you'd want to properly verify the WebAuthn response
    const { error: credentialError } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: 'stored_key', // In production, store the actual public key
        counter: 0,
        created_at: new Date().toISOString(),
      })

    if (credentialError) {
      console.error('Failed to store credential:', credentialError)
      return NextResponse.json(
        { message: 'Failed to save biometric credential' },
        { status: 500 }
      )
    }

    // Clear challenge
    await supabase
      .from('user_profiles')
      .update({
        webauthn_challenge: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      message: 'Biometric authentication setup successful',
    })

  } catch (error) {
    console.error('WebAuthn verification error:', error)
    
    return NextResponse.json(
      { message: 'Failed to verify biometric setup' },
      { status: 500 }
    )
  }
}
