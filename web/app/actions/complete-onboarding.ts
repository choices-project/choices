'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function completeOnboarding(formData: FormData) {
  try {
    const sessionToken = cookies().get('choices_session')?.value
    
    if (!sessionToken) {
      throw new Error('No session found')
    }

    const decodedToken = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any
    const { stableId } = decodedToken

    // Update user profile to mark onboarding as completed
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        preferences: {
          notifications: formData.get('notifications') === 'true',
          dataSharing: formData.get('dataSharing') === 'true',
          theme: formData.get('theme') || 'system'
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', stableId)

    if (updateError) {
      logger.error('Failed to complete onboarding', updateError)
      throw new Error('Failed to complete onboarding')
    }

    // Create updated session token with onboarding completed
    const updatedSessionToken = jwt.sign(
      {
        userId: decodedToken.userId,
        stableId,
        username: decodedToken.username,
        onboardingCompleted: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      },
      process.env.JWT_SECRET!
    )

    // Set updated session cookie
    cookies().set('choices_session', updatedSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    logger.info('Onboarding completed successfully', { stableId })
    
    // Framework handles the redirect properly
    redirect('/dashboard')
  } catch (error) {
    logger.error('Complete onboarding error', error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

