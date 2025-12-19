
import { logger } from '@/lib/utils/logger'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

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
    cookieStore = await cookies()
  } catch {
    // During build or static rendering, cookies() may be unavailable.
    // Fall back to a no-op cookie adapter so we can still construct the client.
    // leave cookieStore undefined
  }

  const { createServerClient } = await import('@supabase/ssr') // dynamic!

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables');
  }

  // Read our custom access token cookie if present (set by /api/auth/login)
  const accessTokenCookie = cookieStore?.get('sb-access-token');
  
  // Debug logging for CI troubleshooting
  if (process.env.CI === 'true') {
    const allCookies = cookieStore ? Array.from(cookieStore.getAll()).map(c => c.name) : [];
    logger.info('[getSupabaseServerClient] Cookies available:', { 
      cookieNames: allCookies,
      hasAccessToken: !!accessTokenCookie?.value,
      accessTokenLength: accessTokenCookie?.value?.length
    });
  }

  const cookieAdapter = {
    get: (name: string) => {
      const value = cookieStore?.get(name)?.value;
      // Debug logging for CI troubleshooting
      if (process.env.CI === 'true' && name.includes('auth')) {
        logger.info('[cookieAdapter.get]', { name, hasValue: !!value });
      }
      return value;
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      try {
        // Debug logging for CI troubleshooting
        if (process.env.CI === 'true' && name.includes('auth')) {
          logger.info('[cookieAdapter.set]', { name, valueLength: value?.length });
        }
        // Add domain attribute for production to work across www and non-www
        // Only set domain if on actual production domain (not localhost/127.0.0.1)
        const isProduction = process.env.NODE_ENV === 'production'
        // Extract domain from cookie options or check environment
        const shouldSetDomain = isProduction &&
          (typeof options.domain === 'string' ||
           process.env.VERCEL_URL?.includes('choices-app.com'))
        const enhancedOptions = {
          ...options,
          ...(shouldSetDomain && { domain: '.choices-app.com' })
        }
        cookieStore?.set(name, value, enhancedOptions)
      } catch {
        // Ignore errors when cookies are unavailable (e.g., build time)
      }
    },
    remove: (name: string, _options: Record<string, unknown>) => {
      try {
        cookieStore?.delete(name)
      } catch {
        // Ignore errors when cookies are unavailable (e.g., build time)
      }
    },
  }

  // Supabase SSR client automatically handles authentication via cookies
  // The cookieAdapter will provide cookies to the client, which will read
  // the session and automatically refresh tokens as needed
  return createServerClient<Database>(url, key, {
    cookies: cookieAdapter,
  })
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
  return createClient<Database>(env.url, env.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
