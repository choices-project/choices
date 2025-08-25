import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Rate limiting: 3 attempts per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await limiter.check(3, ip)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { email, password, username } = body

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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      logger.error('Failed to create Supabase client')
      return NextResponse.json(
        { message: 'Registration service not available' },
        { status: 500 }
      )
    }

    // Create new user - Supabase will handle duplicate email checks automatically
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    })

    if (error) {
      logger.error('Registration error', error, { email, ip })
      
      // Handle specific Supabase errors
      if (error.message.includes('Password should be at least')) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Invalid email')) {
        return NextResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Registration failed. Please try again.' },
        { status: 500 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { message: 'Registration failed' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        username: username || email.split('@')[0],
        email: data.user.email,
        trust_tier: 'T1', // Default trust tier
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      logger.error('Profile creation error', profileError, { userId: data.user.id })
      // Don't fail the registration, but log the error
    }

    // Log successful registration
    logger.userAction('registration_successful', data.user.id, {
      email: data.user.email,
      ip,
    })

    // Return success response
    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: username || email.split('@')[0],
      },
    })

  } catch (error) {
    logger.error('Registration API error', error instanceof Error ? error : new Error(String(error)), {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    })
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
