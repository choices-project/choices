import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json()
    
    // Validation
    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }
    
    if (username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 20 characters or less' },
        { status: 400 }
      )
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    // Get Supabase client
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    
    const supabaseClient = await supabase

    // Check for existing user
    const { data: existingUser } = await supabaseClient
      .from('ia_users')
      .select('stable_id')
      .eq('username', username.toLowerCase() as any)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Create user
    const stableId = uuidv4()
    
    const { error: iaUserError } = await supabaseClient
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: email?.toLowerCase() || `${username.toLowerCase()}@choices-platform.vercel.app`,
        password_hash: null,
        verification_tier: 'T0',
        is_active: true,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)

    if (iaUserError) {
      logger.error('Failed to create IA user', iaUserError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: stableId,
        username: username.toLowerCase(),
        email: email?.toLowerCase() || null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)

    if (profileError) {
      logger.error('Failed to create user profile', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Create session token
    const sessionToken = jwt.sign(
      {
        userId: stableId,
        stableId,
        username: username.toLowerCase(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      },
      process.env.JWT_SECRET!
    )

    // Create response with success data
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: stableId,
        username: username.toLowerCase(),
        email: email?.toLowerCase()
      }
    })

    // Set session cookie
    response.cookies.set('choices_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    logger.info('User registered successfully', { username: username.toLowerCase(), stableId })
    
    return response
  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
