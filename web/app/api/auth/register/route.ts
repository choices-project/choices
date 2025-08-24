import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 3 registrations per hour per IP
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
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (weakPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { message: 'Password is too weak. Please choose a stronger password.' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
      email.toLowerCase().trim()
    )

    if (existingUser.user) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
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
      console.error('Registration error:', error)
      
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
      console.error('Profile creation error:', profileError)
      // Don't fail the registration, but log the error
    }

    // Log successful registration
    console.info(`New user registration: ${data.user.id}`, {
      email: data.user.email,
      ip,
      timestamp: new Date().toISOString(),
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
    console.error('Registration API error:', error)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
