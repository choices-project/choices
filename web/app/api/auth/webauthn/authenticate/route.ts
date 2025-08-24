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
        { message: 'Too many biometric login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
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

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      return NextResponse.json(
        { message: 'User lookup failed' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has biometric credentials
    const { data: credentials, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id)

    if (credentialError || !credentials || credentials.length === 0) {
      return NextResponse.json(
        { message: 'No biometric credentials found for this user' },
        { status: 404 }
      )
    }

    // Generate challenge for authentication
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const challengeBase64 = Buffer.from(challenge).toString('base64')

    // Store challenge in user's profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        webauthn_challenge: challengeBase64,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to store authentication challenge:', updateError)
      return NextResponse.json(
        { message: 'Failed to initiate biometric authentication' },
        { status: 500 }
      )
    }

    // Return authentication options
    const options = {
      challenge: challengeBase64,
      rpId: process.env.NEXT_PUBLIC_VERCEL_URL 
        ? process.env.NEXT_PUBLIC_VERCEL_URL.replace('https://', '') 
        : 'localhost',
      allowCredentials: credentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key',
      })),
      userVerification: 'preferred',
      timeout: 60000,
    }

    return NextResponse.json({
      options,
    })

  } catch (error) {
    console.error('WebAuthn authentication error:', error)
    
    return NextResponse.json(
      { message: 'Failed to initiate biometric authentication' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential, email } = body

    if (!credential || !email) {
      return NextResponse.json(
        { message: 'Credential and email are required' },
        { status: 400 }
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

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      return NextResponse.json(
        { message: 'User lookup failed' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
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
        { message: 'No pending biometric authentication found' },
        { status: 400 }
      )
    }

    // Verify credential exists
    const { data: storedCredential, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id)
      .eq('credential_id', credential.id)
      .single()

    if (credentialError || !storedCredential) {
      return NextResponse.json(
        { message: 'Invalid biometric credential' },
        { status: 401 }
      )
    }

    // For now, just verify the credential ID matches
    // In production, you'd want to properly verify the WebAuthn assertion
    if (storedCredential.credential_id !== credential.id) {
      return NextResponse.json(
        { message: 'Biometric verification failed' },
        { status: 401 }
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

    // Get user profile for role-based response
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', user.id)
      .single()

    // Log successful biometric login
    console.info(`Successful biometric login for user: ${user.id}`, {
      email: user.email,
      trust_tier: userProfile?.trust_tier,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      message: 'Biometric authentication successful',
      user: {
        id: user.id,
        email: user.email,
        trust_tier: userProfile?.trust_tier || 'T1',
        username: userProfile?.username,
      },
    })

  } catch (error) {
    console.error('WebAuthn verification error:', error)
    
    return NextResponse.json(
      { message: 'Failed to verify biometric authentication' },
      { status: 500 }
    )
  }
}
