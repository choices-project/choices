'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { logSecurityEvent } from '@/lib/core/auth/server-actions';

// Import the existing ServerActionContext type
import type { ServerActionContext } from '@/lib/core/auth/server-actions';
import { TypeGuardError } from '@/lib/core/types/guards';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/utils/supabase/server';

const RegisterForm = z.object({
  email: z.string().email('Invalid email'),
  username: z
    .string()
    .min(3, 'Username too short')
    .max(20, 'Username too long')
    .regex(/^[a-z0-9_]+$/i, 'Alphanumeric/underscore only'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function register(
  formData: FormData,
  context: ServerActionContext
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  try {
    logger.info('Register function called with formData', { entries: Array.from(formData.entries()) });
    logger.info('Register function called with context', { context });
    
    // Always use real Supabase for registration
    logger.info('NEXT_PUBLIC_SUPABASE_URL', { url: process.env.NEXT_PUBLIC_SUPABASE_URL });
    logger.info('NODE_ENV', { env: process.env.NODE_ENV });
    
    const supabase = await getSupabaseServerClient();
    logger.info('Supabase client created', { created: !!supabase });
    
    // ---- context usage (security + provenance) ----
    const h = await headers();
    const ip = context.ipAddress ?? h.get('x-forwarded-for') ?? null;
    const ua = context.userAgent ?? h.get('user-agent') ?? null;

    // No authenticated caller should be registering a new account
    if (context.userId) {
      logger.warn('Registration attempt from authenticated user', {
        userId: context.userId,
      });
      return { ok: false, error: 'Already authenticated' };
    }

    // ---- validate input ----
    const payload = {
      email: String(formData.get('email') ?? ''),
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
    };
    
    // Debug logging
    logger.info('Register payload received', { payload });
    logger.info('FormData entries', { entries: Array.from(formData.entries()) });
    
    const data = RegisterForm.parse(payload);

    // ---- idempotent user creation ----
    // Note: supabase client already obtained above
    
    // Note: We don't need to check for existing users here
    // Supabase signUp will handle duplicates and return appropriate errors
    logger.info('Proceeding with user registration');

    // Check for existing username in user_profiles table
    logger.info('Checking for existing username', { username: data.username.toLowerCase() });
    const { data: existingUsername, error: usernameError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('username', data.username.toLowerCase())
      .single();

    if (usernameError && usernameError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking existing username:', usernameError);
      logger.error('Failed to check existing username', new Error(usernameError.message));
      return { ok: false, error: `Failed to check existing username: ${usernameError.message}` };
    }

    if (existingUsername) {
      logger.warn('Registration attempt with existing username', { username: data.username });
      return { ok: false, error: 'Username already taken' };
    }
    
    logger.info('No existing username found, proceeding with user creation');

    // Create user in Supabase Auth using signup (more standard approach)
    const { data: authUserData, error: authError } = await supabase.auth.signUp({
      email: data.email.toLowerCase(),
      password: data.password,
      options: {
        data: {
          username: data.username.toLowerCase(),
          display_name: data.username
        }
      }
    });

    if (authError) {
      logger.error('Failed to create auth user', new Error(authError.message));
      console.error('Auth error details:', authError);
      return { ok: false, error: `Failed to create user account: ${authError.message}` };
    }

    if (!authUserData.user) {
      logger.error('No user returned from auth creation');
      return { ok: false, error: 'Failed to create user account' };
    }
    
    const authUser = authUserData.user;

    // Create user profile using service role client (bypasses RLS)
    const serviceRoleClient = getSupabaseAdminClient();
    const { error: profileError } = await serviceRoleClient
      .from('user_profiles')
      .insert({
        user_id: authUser.id,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        bio: '',
        is_active: true,
        trust_tier: 'T0'
      });

    if (profileError) {
      logger.error('Failed to create user profile', new Error(profileError.message));
      console.error('Profile error details:', profileError);
      return { ok: false, error: `Failed to create user profile: ${profileError.message}` };
    }
    
    logger.info('✅ User profile created successfully');

    // Use Supabase native session management
    // Supabase handles session cookies automatically
    // No need for custom JWT session tokens;

    // ---- audit ----
    logSecurityEvent('USER_REGISTERED', {
      userId: authUser.id,
      email: data.email,
      username: data.username,
      ip,
      ua,
    }, context);

    // ---- navigate via Server Actions redirect (no client race conditions) ----
    logger.info('✅ Registration completed successfully, redirecting to onboarding');
    redirect('/onboarding');
  } catch (err) {
    // Check if this is a Next.js redirect (expected behavior)
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      logger.info('✅ Registration completed successfully, redirecting to onboarding');
      // Re-throw the redirect error so Next.js can handle it
      throw err;
    }
    
    if (err instanceof TypeGuardError) {
      logger.warn('Register type validation failed', { error: err.message });
      return { ok: false, error: `Invalid input: ${err.message}` };
    }
    if (err instanceof z.ZodError) {
      const fieldErrors = err.issues.reduce((acc, issue) => {
        acc[issue.path.join('.')] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      logger.warn('Register validation failed', { fieldErrors });
      return { ok: false, error: 'Validation failed', fieldErrors };
    }
    logger.error('Register action failed', err instanceof Error ? err : new Error(String(err)));
    console.error('Registration error details:', err);
    return { ok: false, error: `Registration failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

