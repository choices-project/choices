import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()
    
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

    // Get Supabase client for regular operations
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    
    const supabaseClient = await supabase

    // Check for existing user by email in user_profiles table
    if (email) {
      const { data: existingEmailUser } = await supabaseClient
        .from('user_profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .single()

      if (existingEmailUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }
    }

    // Check for existing username in user_profiles table
    const { data: existingUsernameUser } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUsernameUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Create user with custom auth (no service role needed)
    const userId = uuidv4()
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user profile directly
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: username.toLowerCase(),
        email: email?.toLowerCase() || `${username.toLowerCase()}@choices-platform.vercel.app`,
        trust_tier: 'T0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

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
        userId: userId,
        stableId: userId,
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
        id: userId,
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

    logger.info('User registered successfully', { username: username.toLowerCase(), stableId: userId })
    
    return response
  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
