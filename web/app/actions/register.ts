'use server'

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { 
  createSecureServerAction,
  secureRedirect,
  validateFormData,
  UsernameSchema,
  EmailSchema,
  type ServerActionContext
} from '@/lib/auth/server-actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const RegisterSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
})

// Enhanced registration action with security features
export const register = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    // Validate form data
    const validatedData = validateFormData(formData, RegisterSchema)
    
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

    logger.info('User registered successfully', { 
      username: validatedData.username.toLowerCase(), 
      stableId 
    })
    
    // Secure redirect with session management
    secureRedirect('/onboarding')
  },
  {
    idempotency: { namespace: 'registration' },
    sessionRotation: true,
    validation: RegisterSchema,
    rateLimit: { endpoint: '/register', maxRequests: 5 }
  }
)

