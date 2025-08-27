import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { setSessionTokenInResponse } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    let username: string
    let email: string | undefined
    let password: string | undefined

    // Handle both form data and JSON requests
    const contentType = req.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const body = await req.json()
      username = body.username
      email = body.email
      password = body.password
    } else {
      // Handle form data
      const formData = await req.formData()
      username = String(formData.get('username') || '')
      email = formData.get('email') ? String(formData.get('email')) : undefined
      password = formData.get('password') ? String(formData.get('password')) : undefined
    }

    // Validate required fields
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (username.length > 20) {
      return NextResponse.json({ error: 'Username must be 20 characters or less' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 })
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('ia_users')
      .select('stable_id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Generate stable ID
    const stableId = uuidv4()

    // Hash password if provided
    let hashedPassword: string | null = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    // Create user in ia_users table
    const { error: iaUserError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: email?.toLowerCase() || `${username.toLowerCase()}@choices-platform.vercel.app`,
        password_hash: hashedPassword,
        verification_tier: 'T0',
        is_active: true,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (iaUserError) {
      logger.error('Failed to create IA user', iaUserError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: stableId,
        username: username.toLowerCase(),
        email: email?.toLowerCase() || null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      logger.error('Failed to create user profile', profileError)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Create session token
    const sessionToken = jwt.sign(
      {
        userId: stableId, // Use stableId as userId for compatibility
        stableId,
        username: username.toLowerCase(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      process.env.JWT_SECRET!
    )

    // Create response with explicit redirect
    const dest = new URL('/onboarding', req.url).toString() // absolute
    
    // Use 302 for WebKit/Safari, 303 for others (WebKit redirect quirk workaround)
    const userAgent = req.headers.get('user-agent') || ''
    const isWebKit = userAgent.includes('WebKit') && !userAgent.includes('Chrome')
    const status = isWebKit ? 302 : 303
    
    const response = NextResponse.redirect(dest, { status })

    // Set session cookie
    setSessionTokenInResponse(sessionToken, response)

    // Add explicit headers for WebKit compatibility
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Content-Length', '0') // help some UA edge cases

    logger.info('User registered successfully', { username: username.toLowerCase(), stableId })

    return response

  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
