import 'server-only';                  // build-time guard
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '../../types/database'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Re-export the Database type for use in other modules
export type { Database }

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    SUPABASE_SECRET_KEY: process.env['SUPABASE_SECRET_KEY']
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return requiredVars
}

// Initialize environment variables
  const env = validateEnvironment()
  
// Create Supabase server client
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Component or Route Handler
            // That are making a `request`
            // console.warn('Could not set cookie from server component:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Component or Route Handler
            // That are making a `request`
            // console.warn('Could not remove cookie from server component:', error);
          }
        },
      },
    }
  );
}

// Create Supabase admin client (for server-side operations requiring elevated privileges)
export async function getSupabaseAdminClient(): Promise<SupabaseClient<Database>> {
  const { createClient } = await import('@supabase/supabase-js');
  
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Helper function to get user from server-side context
export async function getServerUser() {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Log error for debugging but don't expose to client
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting user:', error);
      }
      return null;
    }
    
    return user;
  } catch (error) {
    // Log error for debugging but don't expose to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getServerUser:', error);
    }
    return null;
  }
}

// Helper function to get user profile from server-side context
export async function getServerUserProfile(): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
  const user = await getServerUser();
  
  if (!user) {
    return null;
  }
  
  const supabase = await getSupabaseServerClient();
  
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // Log error for debugging but don't expose to client
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting user profile:', error);
      }
      return null;
    }
    
    return profile as Database['public']['Tables']['user_profiles']['Row'];
  } catch (error) {
    // Log error for debugging but don't expose to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getServerUserProfile:', error);
    }
    return null;
  }
}

// Helper function to check if user is admin
export async function isServerAdmin() {
  const profile = await getServerUserProfile();
  return profile ? profile.is_admin === true : false;
}

// Helper function to require admin access
export async function requireServerAdmin() {
  const isAdmin = await isServerAdmin();
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  return true;
}

// Helper function to require user authentication
export async function requireServerAuth() {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

// Helper function to get user with profile
export async function getServerUserWithProfile() {
  const user = await getServerUser();
  
  if (!user) {
    return null;
  }
  
  const profile = await getServerUserProfile();
  
  return {
    user,
    profile
  };
}

// Helper function to create a new Supabase client for specific operations
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  return await getSupabaseServerClient();
}

// Helper function to create an admin client for specific operations
export async function createServerAdminClient(): Promise<SupabaseClient<Database>> {
  return await getSupabaseAdminClient();
}

// Export types for use in other modules
export type ServerUser = Awaited<ReturnType<typeof getServerUser>>;
export type ServerUserProfile = Awaited<ReturnType<typeof getServerUserProfile>>;
export type ServerUserWithProfile = Awaited<ReturnType<typeof getServerUserWithProfile>>;