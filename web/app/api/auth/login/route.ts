import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { email, userPassword, twoFactorCode } = await request.json()

    // Validate input
    if (!email || !userPassword) {
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
    const isPasswordValid = await bcrypt.compare(userPassword, user.password_hash)
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

    // Check JWT secrets
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      return NextResponse.json(
        { error: 'JWT configuration not available' },
        { status: 503 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        stableId: user.stable_id,
        verificationTier: user.verification_tier,
      },
      jwtSecret,
      { expiresIn: '1h' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      jwtRefreshSecret,
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
    devLog('Login error:', error)
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
    devLog('2FA verification error:', error)
    return false
  }
}
