/**
 * Server-Side Authentication Helper
 * 
 * Provides secure server-side authentication using Supabase SSR cookies.
 * This is the primary authentication mechanism - middleware is UX only.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Create Supabase server client with cookie handling
export function getSupabaseServer() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options: Record<string, unknown>) => {
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options: Record<string, unknown>) => {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}

// Universal auth helper for route handlers
export async function requireUser(req: Request) {
  const supabase = getSupabaseServer();
  
  // Extract user from request headers if available
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Set the auth token for this request
    supabase.auth.setSession({ access_token: token, refresh_token: '' });
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { 
      user: null, 
      fail: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }
  
  return { user, fail: null };
}

// Helper for getting user without failing
export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Helper for checking if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return user !== null;
}

// Helper for getting user ID
export async function getUserId(): Promise<string | null> {
  const user = await getUser();
  return user?.id || null;
}