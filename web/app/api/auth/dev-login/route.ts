import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import jwt from 'jsonwebtoken'

// Development authentication bypass for testing
export async function POST(request: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Development login not available in production' },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { code: 'MISSING_EMAIL', message: 'Email is required' },
        { status: 400 }
      )
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

    // Create a development user
    const devUser = {
      id: 'dev_user_' + Date.now(),
      email: email.toLowerCase(),
      stableId: 'dev_stable_' + Math.random().toString(36).substr(2, 9),
      verificationTier: 'T0',
      displayName: email.split('@')[0],
      isDevUser: true
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: devUser.id,
        email: devUser.email,
        stableId: devUser.stableId,
        verificationTier: devUser.verificationTier,
        isDevUser: true,
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: devUser.id,
        type: 'refresh',
        isDevUser: true,
      },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    )

    // Set cookies
    const response = NextResponse.json({
      user: devUser,
      token,
      refreshToken,
      message: 'Development login successful'
    })

    // Set secure cookies
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    devLog('Development login successful for:', email)
    return response

  } catch (error) {
    devLog('Development login error:', error)
    return NextResponse.json(
      { code: 'LOGIN_ERROR', message: 'Development login failed' },
      { status: 500 }
    )
  }
}
