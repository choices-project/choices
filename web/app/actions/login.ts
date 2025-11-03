'use server'

import { redirect } from 'next/navigation'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * @fileoverview Modern Supabase Authentication Login Action
 * 
 * Implementation using Supabase native authentication.
 * Handles user login with email and password validation.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */
export async function loginAction(formData: FormData) {
  logger.info('Modern Supabase login action called');
  logger.debug('FormData entries', Object.fromEntries(formData.entries()));

  // Extract form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Get Supabase client
  const supabase = await getSupabaseServerClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Use Supabase native authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Authentication error:', authError);
    throw new Error('Invalid email or password');
  }

  if (!authData.user) {
    throw new Error('Authentication failed');
  }

  logger.info('User authenticated successfully', { userId: authData.user.id });
  
  // Check if user has completed onboarding based on key fields
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('demographics, primary_concerns, community_focus, participation_style')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile lookup error:', profileError);
    // Continue anyway - user can complete onboarding later
  }

  // Supabase automatically sets session cookies
  // No need for manual session management
  
  // Check onboarding completion based on presence of key fields
  const isOnboardingCompleted = !!(
    profile?.demographics && 
    profile?.primary_concerns && 
    profile?.community_focus &&
    profile?.participation_style
  );
  
  // Redirect based on onboarding status
  if (isOnboardingCompleted) {
    logger.info('User has completed onboarding, redirecting to dashboard');
    redirect('/dashboard');
  } else {
    logger.info('User needs onboarding, redirecting to onboarding');
    redirect('/onboarding');
  }
}