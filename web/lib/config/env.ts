import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  ADMIN_MONITORING_KEY: z.string().optional(),
  CONGRESS_GOV_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  WEB_PUSH_PRIVATE_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_ENABLE_E2E_HARNESS: z.string().optional(),
});

const envSchema = serverSchema.merge(clientSchema);

export type EnvConfig = z.infer<typeof envSchema>;

let _validatedEnv: EnvConfig | null = null;

export function getValidatedEnv(): EnvConfig {
  if (_validatedEnv) return _validatedEnv;

  const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';
  const isClient = typeof window !== 'undefined';

  if (isClient) {
    // On client, only validate client vars — server vars are never available in the bundle
    const result = clientSchema.safeParse(process.env);
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

  if (isCI) {
    _validatedEnv = {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-only-secret',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-dev-key',
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
