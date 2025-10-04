'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Simple Supabase Authentication Login Action
 * 
 * Completely rebuilt to use Supabase native authentication
 * Removes all old concepts: ia_users, stable_id, custom auth
 * 
 * Created: January 4, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */
export async function simpleLoginAction(formData: FormData) {
  console.log('=== SIMPLE SUPABASE LOGIN ACTION CALLED ===');
  console.log('FormData entries:', Object.fromEntries(formData.entries()));

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

  console.log('✅ User authenticated successfully:', authData.user.id);
  
  // Supabase automatically sets session cookies
  // No need for manual session management
  
  // Simple redirect to dashboard
  console.log('✅ Redirecting to dashboard');
  redirect('/dashboard');
}
