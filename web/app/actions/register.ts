'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { 
  setSessionCookie, 
  rotateSessionToken 
} from '@/lib/auth/session-cookies'
import { 
  withIdempotency, 
  generateIdempotencyKey 
} from '@/lib/auth/idempotency'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const RegisterSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(20, 'Username must be 20 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email address').optional(),
  idempotencyKey: z.string().optional()
})

export async function register(formData: FormData) {
  const idempotencyKey = generateIdempotencyKey()
  
  return withIdempotency(idempotencyKey, async () => {
    try {
      const rawData = {
        username: String(formData.get('username') ?? ''),
        email: String(formData.get('email') ?? ''),
        idempotencyKey
      }
      
      // Validate input
      const validatedData = RegisterSchema.parse(rawData)

          // Check for existing user
      const { data: existingUser } = await supabase
        .from('ia_users')
        .select('stable_id')
        .eq('username', validatedData.username.toLowerCase())
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
          email: validatedData.email?.toLowerCase() || `${validatedData.username.toLowerCase()}@choices-platform.vercel.app`,
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
          username: validatedData.username.toLowerCase(),
          email: validatedData.email?.toLowerCase() || null,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        logger.error('Failed to create user profile', profileError)
        throw new Error('Failed to create user profile')
      }

      // Create session with new security system
      const sessionToken = rotateSessionToken(
        stableId,
        'user',
        stableId
      )

      logger.info('User registered successfully', { 
        username: validatedData.username.toLowerCase(), 
        stableId 
      })
      
      // Framework handles the redirect properly
      redirect('/onboarding')
    } catch (error) {
      logger.error('Registration error', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }, { namespace: 'registration' })
}

