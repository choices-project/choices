import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimiters } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per hour per IP
    const rateLimitResult = await rateLimiters.biometric.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many biometric authentication attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      logger.error('User lookup failed', userError, { email })
      return NextResponse.json(
        { message: 'User lookup failed' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      logger.warn('Biometric authentication attempt for non-existent user', { 
        email, 
        ip: rateLimitResult.reputation?.ip || 'unknown' 
      })
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check for existing WebAuthn credentials
    const { data: credentials, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id)

    if (credentialError) {
      logger.error('Failed to fetch WebAuthn credentials', credentialError, { userId: user.id })
      return NextResponse.json(
        { message: 'Failed to check biometric credentials' },
        { status: 500 }
      )
    }

    if (!credentials || credentials.length === 0) {
      return NextResponse.json(
        { message: 'No biometric credentials found. Please set up biometric authentication first.' },
        { status: 404 }
      )
    }

    // Generate challenge for authentication
    const challenge = crypto.randomUUID()
    
    // Store challenge in user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        webauthn_challenge: challenge,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      logger.error('Failed to store WebAuthn challenge', updateError, { userId: user.id })
      return NextResponse.json(
        { message: 'Failed to initiate biometric authentication' },
        { status: 500 }
      )
    }

    // Return authentication options
    return NextResponse.json({
      challenge,
      rpId: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost',
      userVerification: 'preferred',
      timeout: 60000, // 60 seconds
    })

  } catch (error) {
    logger.error('WebAuthn authentication initiation error', error instanceof Error ? error : new Error(String(error)), {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    })
    
    return NextResponse.json(
      { message: 'Failed to initiate biometric authentication' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per hour per IP
    const rateLimitResult = await rateLimiters.biometric.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many biometric authentication attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { email, credential } = body

    if (!email || !credential) {
      return NextResponse.json(
        { message: 'Email and credential are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      logger.error('User lookup failed', userError, { email })
      return NextResponse.json(
        { message: 'User lookup failed' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      logger.warn('Biometric authentication attempt for non-existent user', { 
        email, 
        ip: rateLimitResult.reputation?.ip || 'unknown' 
      })
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
      logger.warn('No pending biometric authentication found', { userId: user.id })
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
      logger.warn('Invalid biometric credential', { userId: user.id, credentialId: credential.id })
      return NextResponse.json(
        { message: 'Invalid biometric credential' },
        { status: 401 }
      )
    }

    // For now, just verify the credential ID matches
    // In production, you'd want to properly verify the WebAuthn assertion
    if (storedCredential.credential_id !== credential.id) {
      logger.warn('Biometric verification failed - credential mismatch', { userId: user.id })
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
    logger.userAction('biometric_login_successful', user.id, {
      email: user.email,
      trust_tier: userProfile?.trust_tier,
      ip: rateLimitResult.reputation?.ip || 'unknown',
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
    logger.error('WebAuthn verification error', error instanceof Error ? error : new Error(String(error)), {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    })
    
    return NextResponse.json(
      { message: 'Failed to verify biometric authentication' },
      { status: 500 }
    )
  }
}
