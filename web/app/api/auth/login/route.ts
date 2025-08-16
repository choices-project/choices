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
    const { email, password, twoFactorCode } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { code: 'MISSING_FIELDS', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if 2FA is required
    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { code: '2FA_REQUIRED', message: 'Two-factor authentication code is required' },
          { status: 401 }
        )
      }

      // Verify 2FA code (implement TOTP verification here)
      const is2FAValid = await verifyTwoFactorCode(user.id, twoFactorCode)
      if (!is2FAValid) {
        return NextResponse.json(
          { code: 'INVALID_2FA', message: 'Invalid two-factor authentication code' },
          { status: 401 }
        )
      }
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

    // Update last login
    await supabase
      .from('ia_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

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
    console.error('Login error:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to verify 2FA code
async function verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
  try {
    // Get user's 2FA secret
    const { data: user } = await supabase
      .from('ia_users')
      .select('two_factor_secret')
      .eq('id', userId)
      .single()

    if (!user?.two_factor_secret) {
      return false
    }

    // TODO: Implement TOTP verification
    // For now, return true if code is provided
    // In production, use a library like 'speakeasy' to verify TOTP codes
    return code.length === 6 && /^\d{6}$/.test(code)
  } catch (error) {
    console.error('2FA verification error:', error)
    return false
  }
}
