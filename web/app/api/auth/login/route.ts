import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 login attempts per 15 minutes per IP
    const rateLimitResult = await rateLimiters.auth.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { message: 'Invalid username format' },
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

    // Convert username to internal email format
    const internalEmail = `${username.toLowerCase()}@choices.local`

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: password,
    })

    if (error) {
      logger.warn('Login failed', {
        username: username.toLowerCase(),
        ip: rateLimitResult.reputation?.ip || 'unknown',
        error: error.message
      })

      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { message: 'Invalid username or password' },
          { status: 401 }
        )
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { message: 'Account not verified. Please check your email.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { message: 'Login failed' },
        { status: 500 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      logger.error('Failed to fetch user profile', new Error(profileError.message))
      // Don't fail the login, but log the error
    }

    // Log successful login
    logger.info('User logged in successfully', {
      userId: data.user.id,
      username: username.toLowerCase(),
      ip: rateLimitResult.reputation?.ip || 'unknown',
      authMethod: 'password'
    })

    // Return success response with user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        username: profile?.username || username.toLowerCase(),
        displayName: profile?.display_name || username,
        email: data.user.email,
        authMethods: profile?.auth_methods || {}
      },
      session: data.session
    })

  } catch (error) {
    logger.error('Login API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
