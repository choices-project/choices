import { getValidatedEnv } from '@/lib/config/env'
import { logger } from '@/lib/utils/logger'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Runtime guard to prevent client-side usage
const assertRunningOnServer = (fnName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error(`${fnName} must be called on the server`)
  }
}

function isChoicesAppConfiguredHost(
  cfg: ReturnType<typeof getValidatedEnv>,
): boolean {
  const raw =
    cfg.NEXT_PUBLIC_BASE_URL ??
    cfg.NEXT_PUBLIC_SITE_URL ??
    cfg.NEXT_PUBLIC_APP_URL
  if (!raw) return false
  try {
    const host = new URL(raw).hostname.toLowerCase()
    return host === 'choices-app.com' || host.endsWith('.choices-app.com')
  } catch {
    return false
  }
}

/**
 * SSR-safe factory. No top-level import of supabase-js, ssr, or next/headers.
 * We dynamically import only at call time in Node to avoid build-time errors.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  assertRunningOnServer('getSupabaseServerClient')
  const env = getValidatedEnv()

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
  if (env.CI === 'true') {
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
      if (env.CI === 'true' && name.includes('auth')) {
        logger.info('[cookieAdapter.get]', { name, hasValue: !!value });
      }
      return value;
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      try {
        // Debug logging for CI troubleshooting
        if (env.CI === 'true' && name.includes('auth')) {
          logger.info('[cookieAdapter.set]', { name, valueLength: value?.length });
        }
        // Add domain attribute for production to work across www and non-www
        // Only set domain if on actual production domain (not localhost/127.0.0.1)
        const isProduction = process.env.NODE_ENV === 'production'
        const shouldSetDomain =
          isProduction && isChoicesAppConfiguredHost(env)
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
  const cfg = getValidatedEnv()
  const url = cfg.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = cfg.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
