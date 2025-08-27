'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function register(formData: FormData) {
  try {
    const username = String(formData.get('username') ?? '')
    const email = String(formData.get('email') ?? '')
    
    // Validation
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required')
    }
    if (username.length > 20) {
      throw new Error('Username must be 20 characters or less')
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens')
    }

    // Check for existing user
    const { data: existingUser } = await supabase
      .from('ia_users')
      .select('stable_id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      throw new Error('Username already taken')
    }

    // Create user
    const stableId = uuidv4()
    
    const { error: iaUserError } = await supabase
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
      })

    if (iaUserError) {
      logger.error('Failed to create IA user', iaUserError)
      throw new Error('Failed to create user')
    }

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
      throw new Error('Failed to create user profile')
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

    // Set session cookie using cookies() API
    cookies().set('choices_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    logger.info('User registered successfully', { username: username.toLowerCase(), stableId })
    
    // Framework handles the redirect properly
    redirect('/onboarding')
  } catch (error) {
    logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

