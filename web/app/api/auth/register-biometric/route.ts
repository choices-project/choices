import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registration attempts per hour per IP
    const rateLimitResult = await rateLimiters.registration.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { username, credentialId, publicKey, challenge } = body

    // Validate required fields
    if (!username || !credentialId || !publicKey || !challenge) {
      return NextResponse.json(
        { message: 'Username and biometric credentials are required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { message: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { message: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking username availability', new Error(checkError.message))
      return NextResponse.json(
        { message: 'Error checking username availability' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 409 }
      )
    }

    // Generate a unique user ID
    const userId = crypto.randomUUID()

    // Create user profile directly (no email required for biometric-first)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: username.toLowerCase(),
        display_name: username,
        auth_methods: {
          biometric: true,
          device_flow: false,
          password: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      logger.error('User profile creation failed', new Error(profileError.message))
      return NextResponse.json(
        { message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Store biometric credentials
    const { error: credentialError } = await supabase
      .from('webauthn_credentials')
      .insert({
        id: credentialId,
        user_id: userId,
        public_key: publicKey,
        sign_count: 0,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      })

    if (credentialError) {
      logger.error('Biometric credential storage failed', new Error(credentialError.message))
      // Clean up the user profile
      await supabase.from('user_profiles').delete().eq('id', userId)
      return NextResponse.json(
        { message: 'Failed to store biometric credentials' },
        { status: 500 }
      )
    }

    // Log successful registration
    logger.info('Biometric user registered successfully', {
      userId: userId,
      username: username.toLowerCase(),
      ip: rateLimitResult.reputation?.ip || 'unknown',
      authMethod: 'biometric'
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully with biometric authentication',
      user: {
        id: userId,
        username: username.toLowerCase(),
        authMethod: 'biometric'
      }
    })

  } catch (error) {
    logger.error('Biometric registration API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
