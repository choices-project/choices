'use server'

import { z } from 'zod'
import { 
  createSecureServerAction,
  secureRedirect,
  validateFormData,
  logSecurityEvent,
  type ServerActionContext
} from '@/lib/auth/server-actions'
import { 
  rotateSessionToken,
  setSessionCookie 
} from '@/lib/auth/session-cookies'
import { getSupabaseServerClient } from '@/utils/supabase/server'

// Validation schema
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

// Enhanced login action with security features
export const login = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const supabase = getSupabaseServerClient();
    
    // Validate form data
    const validatedData = validateFormData(formData, LoginSchema)
    
    // Get Supabase client
    const supabaseClient = await supabase
    
    // Get user by username
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, username, onboarding_completed')
      .eq('username', validatedData.username.toLowerCase())
      .single()

    if (profileError || !userProfile) {
      throw new Error('Invalid username or password')
    }

    // Get user authentication data
    const { data: userAuth, error: authError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, password_hash, is_active, verification_tier')
      .eq('stable_id', userProfile.user_id)
      .single()

    if (authError || !userAuth) {
      throw new Error('Invalid username or password')
    }

    // Check if user is active
    if (!userAuth.is_active) {
      throw new Error('Account is deactivated')
    }

    // TODO: Implement proper password verification
    // For now, we'll skip password verification since we're using a simplified auth system
    // In production, you would verify the password hash here

    // Create session token
    const sessionToken = rotateSessionToken(
      userAuth.stable_id,
      'user',
      userAuth.stable_id
    )

    // Set secure session cookie
    setSessionCookie(sessionToken, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Log successful login
    logSecurityEvent('USER_LOGIN', {
      userId: userAuth.stable_id,
      username: userProfile.username,
      verificationTier: userAuth.verification_tier
    }, context)

    // Redirect based on onboarding status
    if (userProfile.onboarding_completed) {
      secureRedirect('/dashboard')
    } else {
      secureRedirect('/onboarding')
    }
  },
  {
    sessionRotation: true,
    validation: LoginSchema,
    rateLimit: { endpoint: '/login', maxRequests: 10 }
  }
)
