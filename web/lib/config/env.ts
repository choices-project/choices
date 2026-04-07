import { z } from 'zod';

/** When adding or removing keys, update `web/.env.local.example` and `docs/ENVIRONMENT_VARIABLES.md`. */

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  ADMIN_MONITORING_KEY: z.string().optional(),
  CONGRESS_GOV_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_VAPID_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_VAPID_SUBJECT: z.string().optional(),
  /** Legacy aliases (prefer `WEB_PUSH_VAPID_*`) */
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_CONTACT_EMAIL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DEBUG_MIDDLEWARE: z.string().optional(),
  PRIVACY_PEPPER_DEV: z.string().optional(),
  PRIVACY_PEPPER_CURRENT: z.string().optional(),
  PRIVACY_PEPPER_PREVIOUS: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_DB: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  GOVINFO_API_KEY: z.string().optional(),
  GPO_API_KEY: z.string().optional(),
  GOVINFO_APIKEY: z.string().optional(),
  GOVINFO_KEY: z.string().optional(),
  GOOGLE_CIVIC_API_KEY: z.string().optional(),
  AUTH_RATE_LIMIT_ENABLED: z.string().optional(),
  ENABLE_PERFORMANCE_TRACKING: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  FEATURE_FLAGS_OVERRIDE: z.string().optional(),
  /** GitHub Actions / CI runners */
  CI: z.string().optional(),
  /** Set by Vercel when deployed; used for WebAuthn / hosting checks */
  VERCEL: z.string().optional(),
  /** Vercel host for the deployment (no scheme), e.g. `project.vercel.app` */
  VERCEL_URL: z.string().optional(),
  /** Vercel: `production` | `preview` | `development` */
  VERCEL_ENV: z.string().optional(),
  /** Playwright / local E2E toggles (server; not bundled to client) */
  PLAYWRIGHT_USE_MOCKS: z.string().optional(),
  E2E: z.string().optional(),
  PLAYWRIGHT: z.string().optional(),
  /** Fine-grained PAT with `issues:write` for the target repo (admin feedback → GitHub Issues) */
  GITHUB_ISSUES_TOKEN: z.string().optional(),
  /** Target repository as `owner/repo` (e.g. `acme/choices`) */
  GITHUB_ISSUES_REPOSITORY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  /** Legacy app URL used in some crons/emails; prefer `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` */
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE: z.string().optional(),
  NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET: z.string().optional(),
  NEXT_PUBLIC_PWA_DEV: z.string().optional(),
  NEXT_PUBLIC_PWA_DEBUG: z.string().optional(),
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_ENABLE_E2E_HARNESS: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const envSchema = serverSchema.merge(clientSchema);

export type EnvConfig = z.infer<typeof envSchema>;

let _validatedEnv: EnvConfig | null = null;

/**
 * Snapshot of `NEXT_PUBLIC_*` for client-side validation.
 *
 * **Important (Next.js):** `NEXT_PUBLIC_*` values are inlined at build time only when the bundler
 * sees a static `process.env.NEXT_PUBLIC_*` access. Passing `process.env` into `safeParse()` does not
 * get those replacements, so production can incorrectly see Supabase URL/key as undefined even when
 * they are set in Vercel.
 */
function getClientPublicEnvSnapshot(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_MAINTENANCE: process.env.NEXT_PUBLIC_MAINTENANCE,
    NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET: process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET,
    NEXT_PUBLIC_PWA_DEV: process.env.NEXT_PUBLIC_PWA_DEV,
    NEXT_PUBLIC_PWA_DEBUG: process.env.NEXT_PUBLIC_PWA_DEBUG,
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_ENABLE_E2E_HARNESS: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };
}

export function getValidatedEnv(): EnvConfig {
  if (_validatedEnv) return _validatedEnv;

  const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';
  const isClient = typeof window !== 'undefined';

  if (isClient) {
    // On client, only validate client vars — server vars are never available in the bundle.
    // Playwright + dev server: NEXT_PUBLIC_* can be missing from the client bundle during hydration
    // even when .env.local exists on the host; the server-side `isCI` branch below never runs here.
    // Only NEXT_PUBLIC_* is visible in the browser bundle; do not gate on CI / PLAYWRIGHT_* here.
    const snapshot = getClientPublicEnvSnapshot();
    const clientE2eRelaxed = snapshot.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

    const clientEnv = clientE2eRelaxed
      ? {
          ...snapshot,
          NEXT_PUBLIC_SUPABASE_URL:
            snapshot.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            snapshot.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'e2e-placeholder-anon-key',
        }
      : snapshot;

    const result = clientSchema.safeParse(clientEnv);
    if (!result.success) {
      const formatted = result.error.issues
        .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      console.error(`Environment validation failed (client):\n${formatted}`);
      throw new Error(`Missing or invalid environment variables:\n${formatted}`);
    }
    _validatedEnv = { ...result.data } as EnvConfig;
    return _validatedEnv;
  }

  // Tests and CI: avoid failing on missing production secrets; still honor harness/playwright flags.
  if (isCI) {
    _validatedEnv = {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-only-secret',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-dev-key',
      NEXT_PUBLIC_ENABLE_E2E_HARNESS: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS,
      CI: process.env.CI,
      PLAYWRIGHT_USE_MOCKS: process.env.PLAYWRIGHT_USE_MOCKS,
      E2E: process.env.E2E,
      PLAYWRIGHT: process.env.PLAYWRIGHT,
    } as EnvConfig;
    return _validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Environment validation failed:\n${formatted}`);
    throw new Error(`Missing or invalid environment variables:\n${formatted}`);
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}

export const env = new Proxy({} as EnvConfig, {
  get(_, prop: string) {
    const validated = getValidatedEnv();
    return validated[prop as keyof EnvConfig];
  },
});
