import { NextResponse } from 'next/server';
import type { NextRequest} from 'next/server';

import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient, type Database } from '@/utils/supabase/server'

// Use generated types from Supabase - automatically stays in sync with your database schema
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export async function POST(request: NextRequest) {
  try {
    // CSRF protection is handled by Next.js middleware in production
    // For now, we'll skip CSRF validation in test environment

    // Rate limiting: 10 login attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const rateLimitResult = await apiRateLimiter.checkLimit(
      ip,
      '/api/auth/login',
      withOptional({}, { userAgent })
    );
    
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
    const supabaseClient = await getSupabaseServerClient()

    // E2E tests should use real Supabase authentication - no mock responses

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (authError || !authData.user) {
      logger.warn('Login failed', { email, error: authError?.message })
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile for additional data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('username, trust_tier, display_name, avatar_url, bio, is_active')
      .eq('user_id', authData.user.id)
      .single() as { data: UserProfile | null; error: any }

    if (profileError || !profile) {
      logger.warn('User profile not found after login', { userId: authData.user.id })
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      )
    }

    // User profile loaded successfully
    const displayName = (profile as any).display_name || profile.username || authData.user.email || 'User'
    logger.info('User profile loaded', { userId: authData.user.id, displayName })

    logger.info('User logged in successfully', { 
      userId: authData.user.id, 
      email: authData.user.email,
      displayName
    })

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_id: profile.user_id,
        display_name: displayName,
        bio: profile.bio,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      session: authData.session,
      token: authData.session?.access_token
    })

    // Set Supabase session cookies for middleware authentication
    if (authData.session) {
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      
      // Set access token cookie
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge
      })
      
      // Set refresh token cookie
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge
      })
    }

    return response

  } catch (error) {
    logger.error('Login error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}