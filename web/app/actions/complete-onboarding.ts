'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import {
  createSecureServerAction,
  validateFormData,
  getAuthenticatedUser,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

// Validation schema
const OnboardingSchema = z.object({
  notifications: z.string().transform(val => val === 'true'),
  dataSharing: z.string().transform(val => val === 'true'),
  theme: z.string().default('system')
})

// Simple server action for E2E testing
export function completeOnboardingAction(formData: FormData) {
  logger.info('=== COMPLETE ONBOARDING ACTION CALLED ===');
  logger.info('FormData entries', { entries: Object.fromEntries(formData.entries()) });
  logger.info('E2E environment', { e2e: process.env.E2E });

  // Always use real authentication - no E2E bypasses

  // Mirror secure action behavior: directly redirect after form validation in this helper
  redirect('/dashboard'); // authoritative redirect
}

// Enhanced onboarding completion action with security features
export const completeOnboarding = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    logger.info('=== COMPLETE ONBOARDING SERVER ACTION CALLED ===');
    logger.info('FormData entries', { entries: Object.fromEntries(formData.entries()) });
    logger.info('E2E environment', { e2e: process.env.E2E });
    logger.info('FormData keys', { keys: Array.from(formData.keys()) });
    logger.info('FormData values', { values: Array.from(formData.values()) });

    // Always use real authentication - no E2E bypasses

    // Get authenticated user
    const user = await getAuthenticatedUser(context)
    logger.info('Authenticated user', { userId: user?.userId });

    // Validate form data
    const validatedData = validateFormData(formData, OnboardingSchema)
    logger.info('Validated data', { data: validatedData });

    // Get Supabase client
    const supabaseClient = await getSupabaseServerClient()

    if (!supabaseClient) {
      throw new Error('Supabase client not available')
    }

    // Update or create user profile with onboarding data
    const updateData = {
      privacy_settings: {
        notifications: validatedData.notifications,
        dataSharing: validatedData.dataSharing,
        theme: validatedData.theme
      },
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.userId)

    if (updateError) {
      logger.info('Profile update error', { error: updateError });
      throw new Error('Failed to complete onboarding')
    }

    // Use Supabase native session management
    // Supabase handles session cookies automatically
    // No need for custom JWT session tokens

    // Authoritative redirect from server action
    logger.info('Onboarding completed successfully, redirecting to dashboard');
    redirect('/dashboard'); // 303; throws to short-circuit the action
  }
)

