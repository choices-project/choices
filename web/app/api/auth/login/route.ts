import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
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
    const supabase = getSupabaseServerClient();
    const supabaseClient = await supabase;

    // Find user in ia_users table
    const { data: user, error: userError } = await supabaseClient
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
    if (!user || !('password_hash' in user) || !user.password_hash) {
      logger.warn('Login failed - no password set', {
        username: username.toLowerCase(),
        ip: rateLimitResult.reputation?.ip || 'unknown'
      })
      return NextResponse.json(
        { message: 'This account does not have a password set. Please use biometric authentication.' },
        { status: 401 }
      )
    }

    // Type assertion to ensure user is the correct type
    const userData = user as any

    // Verify password
    const passwordValid = await bcrypt.compare(password, userData.password_hash)
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
    if (!userData.is_active) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Get user profile (for future use)
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.stable_id)
      .single()

    if (profileError) {
      logger.error('Failed to fetch user profile', new Error(profileError.message))
      // Don't fail the login, but log the error
    }

    // Create session user object
    const sessionUser: SessionUser = {
      id: userData.id,
      stableId: userData.stable_id,
      username: userData.stable_id,
      email: userData.email,
      verificationTier: userData.verification_tier,
      isActive: userData.is_active,
      twoFactorEnabled: userData.two_factor_enabled,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    }

    // Create session token
    const sessionToken = createSessionToken(sessionUser)
    setSessionToken(sessionToken)

    // Log successful login
    logger.info('User logged in successfully', {
      userId: userData.id,
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
