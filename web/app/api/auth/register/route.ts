import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js';
import { handleError, getUserMessage, getHttpStatus, ValidationError, AuthenticationError, NotFoundError } from '@/lib/error-handler';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    devLog('Registration attempt for email:', request.body ? 'email provided' : 'no email')
    
    if (!supabase) {
      throw new Error('Authentication service not configured')
    }

    const { email, password: userPassword, twoFactorEnabled } = await request.json()

    // Validate input
    if (!email || !userPassword) {
      throw new ValidationError('Email and password are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format')
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(userPassword)) {
      throw new ValidationError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      throw new AuthenticationError('User with this email already exists')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(userPassword, saltRounds)

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
      devLog('User creation error:', createError)
      throw new NotFoundError('Failed to create user account')
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
    devLog('Registration error:', error)
    const appError = handleError(error as Error, { context: 'auth-register' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}
