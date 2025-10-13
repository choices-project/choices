'use server'

import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * Modern Supabase Authentication Login Action
 * 
 * Completely rebuilt to use Supabase native authentication
 * Removes all old concepts: ia_users, stable_id, custom auth
 * 
 * Created: January 4, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
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
  
  // Check if user has completed onboarding
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile lookup error:', profileError);
    // Continue anyway - user can complete onboarding later
  }

  // Supabase automatically sets session cookies
  // No need for manual session management
  
  // Redirect based on onboarding status
  if (profile?.onboarding_completed) {
    logger.info('User has completed onboarding, redirecting to dashboard');
    redirect('/dashboard');
  } else {
    logger.info('User needs onboarding, redirecting to onboarding');
    redirect('/onboarding');
  }
}