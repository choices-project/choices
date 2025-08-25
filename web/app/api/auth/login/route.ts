import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Rate limiting: 5 attempts per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await limiter.check(5, ip)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      // Log failed login attempt for security monitoring
      logger.warn('Failed login attempt', {
        email,
        error: error.message,
        ip,
      })

      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile for role-based redirect
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trust_tier, username')
      .eq('user_id', data.user.id)
      .single()

    // Log successful login
    logger.userAction('login_successful', data.user.id, {
      email: data.user.email,
      trust_tier: profile?.trust_tier,
      ip,
    })

    // Return success response with user info
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        trust_tier: profile?.trust_tier || 'T1',
        username: profile?.username,
      },
      session: data.session,
    })

  } catch (error) {
    logger.error('Login API error', error instanceof Error ? error : new Error(String(error)), {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    })
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
