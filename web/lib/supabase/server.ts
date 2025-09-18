import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Server-side Supabase client with SSR support
 */

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { 
          return cookieStore.get(name)?.value; 
        },
        set(name: string, value: string, options: CookieOptions) { 
          cookieStore.set({ name, value, ...options }); 
        },
        remove(name: string, options: CookieOptions) { 
          cookieStore.set({ name, value: '', ...options, maxAge: 0 }); 
        }
      }
    }
  );
}

/**
 * Service role client for admin operations
 * This bypasses RLS and should only be used server-side
 */
export function getSupabaseServiceRole() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
