'use server'

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { 
  createSecureServerAction,
  secureRedirect,
  validateFormData,
  getAuthenticatedUser,
  type ServerActionContext
} from '@/lib/auth/server-actions'
import { 
  verifySessionToken,
  rotateSessionToken,
  setSessionCookie 
} from '@/lib/auth/session-cookies'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const OnboardingSchema = z.object({
  notifications: z.string().transform(val => val === 'true'),
  dataSharing: z.string().transform(val => val === 'true'),
  theme: z.string().default('system')
})

// Enhanced onboarding completion action with security features
export const completeOnboarding = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    
    // Validate form data
    const validatedData = validateFormData(formData, OnboardingSchema)

    // Update user profile to mark onboarding as completed
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        preferences: {
          notifications: validatedData.notifications,
          dataSharing: validatedData.dataSharing,
          theme: validatedData.theme
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.userId)

    if (updateError) {
      throw new Error('Failed to complete onboarding')
    }

    // Rotate session token after privilege change (onboarding completion)
    const newSessionToken = rotateSessionToken(
      user.userId,
      user.userRole,
      user.userId
    )

    // Set secure session cookie
    setSessionCookie(newSessionToken, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Secure redirect to dashboard
    secureRedirect('/dashboard')
  },
  {
    requireAuth: true,
    sessionRotation: true,
    validation: OnboardingSchema,
    rateLimit: { endpoint: '/onboarding', maxRequests: 10 }
  }
)

