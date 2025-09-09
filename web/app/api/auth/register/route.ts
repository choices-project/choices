import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/rate-limit'
import { 
  validateCsrfProtection, 
  createCsrfErrorResponse 
} from '../_shared'

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF protection for state-changing operation
    if (!validateCsrfProtection(request)) {
      return createCsrfErrorResponse()
    }

    // Rate limiting: 5 registration attempts per 15 minutes per IP
    const rateLimitResult = await rateLimiters.auth.check(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { email, password, username, display_name } = body

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { message: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json(
        { message: 'Username must be 3-20 characters, letters, numbers, hyphens, and underscores only' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Use Supabase Auth for registration
    const supabase = getSupabaseServerClient()
    const supabaseClient = await supabase

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          username: username,
          display_name: display_name || username
        }
      }
    })

    if (authError || !authData.user) {
      logger.warn('Registration failed', { email, username, error: authError?.message })
      
      // Handle specific Supabase errors
      if (authError?.message.includes('already registered')) {
        return NextResponse.json(
          { message: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { message: 'Registration failed. Please try again.' },
        { status: 400 }
      )
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        username: username,
        email: email.toLowerCase().trim(),
        display_name: display_name || username,
        trust_tier: 'T0',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      logger.error('Failed to create user profile', profileError, { 
        user_id: authData.user.id
      })
      
      // If profile creation fails, log the issue and rely on a secure backend cleanup process
      // Cleanup of orphaned auth users should be handled by a secure backend process or database trigger
      logger.warn('Orphaned auth user created - cleanup required', {
        user_id: authData.user.id,
        email: authData.user.email,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json(
        { message: 'Registration failed. Please try again.' },
        { status: 500 }
      )
    }

    logger.info('User registered successfully', { 
      userId: authData.user.id, 
      email: authData.user.email,
      username: username 
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        trust_tier: profile.trust_tier,
        display_name: profile.display_name,
        is_active: profile.is_active
      },
      message: 'Registration successful. Please check your email to verify your account.'
    })

  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}