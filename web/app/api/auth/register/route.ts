import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
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
    const { username, password, enableBiometric, enableDeviceFlow } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (weakPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { message: 'Please choose a stronger password' },
        { status: 400 }
      )
    }

    // Make authentication methods optional - users can register with just password
    // if (!enableBiometric && !enableDeviceFlow) {
    //   return NextResponse.json(
    //     { message: 'At least one authentication method must be enabled' },
    //     { status: 400 }
    //   )
    // }

    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabaseClient
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

    // Create user with email (using username@choices-platform.vercel.app as internal email)
    const internalEmail = `${username.toLowerCase()}@choices-platform.vercel.app`
    
    const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
      email: internalEmail,
      password: password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: username,
          auth_methods: {
            biometric: enableBiometric,
            device_flow: enableDeviceFlow,
            password: true
          }
        }
      }
    })

    if (signUpError) {
      logger.error('User registration failed', new Error(signUpError.message))
      return NextResponse.json(
        { message: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        username: username.toLowerCase(),
        display_name: username,
        email: internalEmail,
        auth_methods: {
          biometric: enableBiometric,
          device_flow: enableDeviceFlow,
          password: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)

    if (profileError) {
      logger.error('User profile creation failed', new Error(profileError.message))
      // Try to clean up the auth user if profile creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Log successful registration
    logger.info('User registered successfully', {
      userId: authData.user.id,
      username: username.toLowerCase(),
      ip: rateLimitResult.reputation?.ip || 'unknown',
      authMethods: {
        biometric: enableBiometric,
        deviceFlow: enableDeviceFlow
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        username: username.toLowerCase(),
        authMethods: {
          biometric: enableBiometric,
          deviceFlow: enableDeviceFlow
        }
      }
    })

  } catch (error) {
    logger.error('Registration API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
