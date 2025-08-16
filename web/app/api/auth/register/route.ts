import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password, twoFactorEnabled } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { code: 'MISSING_FIELDS', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { code: 'INVALID_EMAIL', message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { code: 'INVALID_PASSWORD', message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { code: 'USER_EXISTS', message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate stable ID
    const stableId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create user
    const { data: user, error: createError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        verification_tier: 'T0',
        is_active: true,
        two_factor_enabled: twoFactorEnabled || false,
      })
      .select()
      .single()

    if (createError) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { code: 'CREATE_USER_FAILED', message: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        stableId: user.stable_id,
        verificationTier: user.verification_tier,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    // Store refresh token
    await supabase
      .from('ia_refresh_tokens')
      .insert({
        user_id: user.id,
        token_hash: await bcrypt.hash(refreshToken, 10),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      stableId: user.stable_id,
      verificationTier: user.verification_tier,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    return NextResponse.json({
      user: userResponse,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
