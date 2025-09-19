import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/core/security/rate-limit'
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
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use Supabase Auth for authentication
    const supabase = getSupabaseServerClient()
    const supabaseClient = await supabase

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    })

    if (authError || !authData.user) {
      logger.warn('Login failed', { email, error: authError?.message })
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('username, trust_tier, display_name, avatar_url, bio, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      logger.warn('User profile not found after login', { userId: authData.user.id })
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (!profile.is_active) {
      logger.warn('Inactive user attempted login', { userId: authData.user.id })
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 403 }
      )
    }

    logger.info('User logged in successfully', { 
      userId: authData.user.id, 
      email: authData.user.email,
      username: profile.username 
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        trust_tier: profile.trust_tier,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_active: profile.is_active
      },
      session: authData.session
    })

  } catch (error) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}