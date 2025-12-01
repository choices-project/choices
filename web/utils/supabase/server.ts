import type { SupabaseClient } from '@supabase/supabase-js'

import { logger } from '@/lib/utils/logger'
import type { Database } from '@/types/supabase'

// Runtime guard to prevent client-side usage
const assertRunningOnServer = (fnName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error(`${fnName} must be called on the server`)
  }
}

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    // In CI and test environments we don't want builds or tests to fail purely
    // due to missing Supabase env vars. Use safe, test-only fallbacks instead.
    if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
      logger.warn(
        'Supabase environment variables missing; using test-only fallbacks in CI/test',
        { missing },
      )

      return {
        NEXT_PUBLIC_SUPABASE_URL:
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'fake-dev-key-for-ci-only',
        SUPABASE_SERVICE_ROLE_KEY:
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-only-secret'
      }
    }

    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return requiredVars
}

/**
 * SSR-safe factory. No top-level import of supabase-js, ssr, or next/headers.
 * We dynamically import only at call time in Node to avoid build-time errors.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  assertRunningOnServer('getSupabaseServerClient')
  const env = validateEnvironment()

  // Dynamically import next/headers to avoid build-time errors when imported from pages/
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type CookiesReturn = Awaited<ReturnType<typeof import('next/headers')['cookies']>>
  let cookieStore: CookiesReturn | undefined
  try {
    const { cookies } = await import('next/headers')
    cookieStore = cookies()
  } catch {
    // During build or static rendering, cookies() may be unavailable.
    // Fall back to a no-op cookie adapter so we can still construct the client.
    cookieStore = undefined as any;
  }

  const { createServerClient } = await import('@supabase/ssr') // dynamic!

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables');
  }

  const isProduction = process.env.NODE_ENV === 'production'

  const cookieAdapter = {
    get: (name: string) => {
      const value = cookieStore?.get(name)?.value
      logger.debug('Supabase SSR cookie get', { name, hasValue: !!value })
      return value
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      try {
        // Ensure proper cookie settings for production
        const cookieOptions = {
          ...options,
          secure: isProduction, // HTTPS only in production
          sameSite: 'lax' as const, // CSRF protection
          path: '/', // Available site-wide
          httpOnly: options.httpOnly !== false, // Default to httpOnly for security
        }
        cookieStore?.set(name, value, cookieOptions)
        logger.debug('Supabase SSR cookie set', {
          name,
          hasValue: !!value,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
        })
      } catch (error) {
        logger.error('Failed to set Supabase SSR cookie', {
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    remove: (name: string, _options: Record<string, unknown>) => {
      try {
        cookieStore?.delete(name)
        logger.debug('Supabase SSR cookie removed', { name })
      } catch (error) {
        logger.error('Failed to remove Supabase SSR cookie', {
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  }

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: cookieAdapter,
    },
  )
}

/**
 * Admin client using service role key. Use ONLY on the server for admin tasks.
 */
export async function getSupabaseAdminClient(): Promise<SupabaseClient<Database>> {
  assertRunningOnServer('getSupabaseAdminClient')
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  if (!env.url || !env.serviceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient<Database>(env.url, env.serviceKey)
}
