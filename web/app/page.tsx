import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { getSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Root Landing Page
 * Server-side redirect based on authentication status
 * Redirects authenticated users to dashboard, unauthenticated users to auth page
 */
export default async function RootPage() {
  try {
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      // If Supabase is not available, redirect to auth
      redirect('/auth');
    }

    // Check for user session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      // User is not authenticated, redirect to auth
      redirect('/auth');
    }

    // User is authenticated, redirect to dashboard
    redirect('/dashboard');
  } catch (error) {
    // On any error, default to auth page
    redirect('/auth');
  }
}