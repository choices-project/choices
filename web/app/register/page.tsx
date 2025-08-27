import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function register(formData: FormData) {
  'use server'
  
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
    const { cookies } = await import('next/headers')
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

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Choices and start making better decisions
          </p>
        </div>

        <form action={register} noValidate className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                maxLength={20}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create account
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
