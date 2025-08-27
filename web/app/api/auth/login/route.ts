import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { createSessionToken, setSessionToken, SessionUser } from '@/lib/session'

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

    // Use service role for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find user in ia_users table
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', username.toLowerCase())
      .single()

    if (userError || !user) {
      logger.warn('Login failed - user not found', {
        username: username.toLowerCase(),
        ip: rateLimitResult.reputation?.ip || 'unknown',
        error: userError?.message || 'User not found'
      })
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if user has a password
    if (!user.password_hash) {
      logger.warn('Login failed - no password set', {
        username: username.toLowerCase(),
        ip: rateLimitResult.reputation?.ip || 'unknown'
      })
      return NextResponse.json(
        { message: 'This account does not have a password set. Please use biometric authentication.' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      logger.warn('Login failed - invalid password', {
        username: username.toLowerCase(),
        ip: rateLimitResult.reputation?.ip || 'unknown'
      })
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.stable_id)
      .single()

    if (profileError) {
      logger.error('Failed to fetch user profile', new Error(profileError.message))
      // Don't fail the login, but log the error
    }

    // Create session user object
    const sessionUser: SessionUser = {
      id: user.id,
      stableId: user.stable_id,
      username: user.stable_id,
      email: user.email,
      verificationTier: user.verification_tier,
      isActive: user.is_active,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    // Create session token
    const sessionToken = createSessionToken(sessionUser)
    setSessionToken(sessionToken)

    // Log successful login
    logger.info('User logged in successfully', {
      userId: user.id,
      username: username.toLowerCase(),
      ip: rateLimitResult.reputation?.ip || 'unknown',
      authMethod: 'password'
    })

    // Return success response with user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sessionUser
    })

  } catch (error) {
    logger.error('Login API error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
