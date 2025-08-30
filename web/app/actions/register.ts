'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '@/lib/logger';
import { TypeGuardError } from '@/lib/types/guards';
import { logSecurityEvent } from '@/lib/auth/server-actions';
import { setSessionCookie, rotateSessionToken } from '@/lib/auth/session-cookies';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Import the existing ServerActionContext type
import { ServerActionContext } from '@/lib/auth/server-actions';

const RegisterForm = z.object({
  email: z.string().email('Invalid email'),
  username: z
    .string()
    .min(3, 'Username too short')
    .max(20, 'Username too long')
    .regex(/^[a-z0-9_]+$/i, 'Alphanumeric/underscore only'),
  name: z.string().min(1, 'Required').max(80, 'Too long'),
});

export async function register(
  formData: FormData,
  context: ServerActionContext
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  try {
    const supabase = getSupabaseServerClient();
    
    // ---- context usage (security + provenance) ----
    const h = headers();
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
      name: String(formData.get('name') ?? ''),
    };
    const data = RegisterForm.parse(payload);

    // ---- idempotent user creation ----
    const stableId = uuidv4();
    
    // Get Supabase client
    const supabaseClient = await supabase
    
    // Check for existing user by email
    const { data: existingUser } = await supabaseClient
      .from('user_profiles')
      .select('user_id, username')
      .eq('email', data.email.toLowerCase())
      .single();

    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email: data.email });
      return { ok: false, error: 'Email already registered' };
    }

    // Check for existing username
    const { data: existingUsername } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('username', data.username.toLowerCase())
      .single();

    if (existingUsername) {
      logger.warn('Registration attempt with existing username', { username: data.username });
      return { ok: false, error: 'Username already taken' };
    }

    // Create user in ia_users table
    const { error: iaUserError } = await supabaseClient
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: data.email.toLowerCase(),
        password_hash: null, // Will be set up later
        verification_tier: 'T0',
        is_active: true,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (iaUserError) {
      logger.error('Failed to create IA user', new Error(iaUserError.message));
      return { ok: false, error: 'Failed to create user account' };
    }

    // Create user profile
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        user_id: stableId,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        display_name: data.name,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      logger.error('Failed to create user profile', new Error(profileError.message));
      return { ok: false, error: 'Failed to create user profile' };
    }

    // ---- session issuance ----
    const sessionToken = rotateSessionToken(stableId, 'user', stableId);

    // Set secure session cookie
    setSessionCookie(sessionToken, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // ---- audit ----
    logSecurityEvent('USER_REGISTERED', {
      userId: stableId,
      email: data.email,
      username: data.username,
      ip,
      ua,
    }, context);

    // ---- navigate via Server Actions redirect (no client race conditions) ----
    redirect('/onboarding');
  } catch (err) {
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
    return { ok: false, error: 'Registration failed' };
  }
}

