import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy'
import { handleError, getUserMessage, getHttpStatus, ValidationError, AuthenticationError } from '@/lib/error-handler';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      throw new Error('Authentication service not configured')
    }

    const { email, password: userPassword, twoFactorCode } = await request.json()

    // Validate input
    if (!email || !userPassword) {
      throw new ValidationError('Email and password are required')
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .select('id, email, password_hash, two_factor_enabled, stable_id, verification_tier, is_active, created_at, updated_at')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(userPassword, user.password_hash)
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Check if 2FA is required
    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        throw new AuthenticationError('Two-factor authentication code is required')
      }

      // Verify 2FA code (implement TOTP verification here)
      const is2FAValid = await verifyTwoFactorCode(supabase, user.id, twoFactorCode)
      if (!is2FAValid) {
        throw new AuthenticationError('Invalid two-factor authentication code')
      }
    }

    // Check JWT secrets
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT configuration not available')
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
    const appError = handleError(error as Error, { context: 'auth-login' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}

// Helper function to verify 2FA code
async function verifyTwoFactorCode(supabaseClient: any, userId: string, code: string): Promise<boolean> {
  try {
    // Get user's 2FA secret
    const { data: user } = await supabaseClient
      .from('ia_users')
      .select('two_factor_secret')
      .eq('id', userId)
      .single()

    if (!user?.two_factor_secret) {
      return false
    }

    // Verify TOTP code using speakeasy
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps (60 seconds) for clock skew
    })

    return verified
  } catch (error) {
    devLog('2FA verification error:', error)
    return false
  }
}
