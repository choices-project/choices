type Env = Record<string, string | undefined>;

// Run once at server start (import from your route/util entry point)
function isDev(env: Env) {
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV ?? 'development';
  return nodeEnv === 'development' || nodeEnv === 'test';
}

function isPrefixed(v?: string) {
  return !!v && /^(base64|hex):/.test(v);
}
function byteLenFromPrefixed(v: string): number {
  const m = v.match(/^(base64|hex):(.*)$/);
  if (!m?.[2]) return 0;
  const [, enc, body] = m;
  return enc === 'hex' ? Buffer.from(body, 'hex').length : Buffer.from(body, 'base64').length;
}

/**
 * Validate privacy pepper configuration.
 *
 * - In dev/test: requires PRIVACY_PEPPER_DEV and forbids PRIVACY_PEPPER_CURRENT.
 * - In preview/prod: requires PRIVACY_PEPPER_CURRENT (≥32 bytes, prefixed) and forbids PRIVACY_PEPPER_DEV.
 *
 * Tests can pass a custom env object; runtime callers use the real process.env by default.
 */
export function assertPepperConfig(envOverride?: Env) {
  const env: Env = envOverride ?? process.env;

  if (isDev(env)) {
    if (!env.PRIVACY_PEPPER_DEV) {
      throw new Error('PRIVACY_PEPPER_DEV required in dev/test');
    }
    return;
  }

  if (env.PRIVACY_PEPPER_DEV) {
    throw new Error('PRIVACY_PEPPER_DEV must NOT be set in preview/prod');
  }
  const cur = env.PRIVACY_PEPPER_CURRENT;
  if (!isPrefixed(cur)) throw new Error('PRIVACY_PEPPER_CURRENT must be base64:/hex: prefixed');
  if (byteLenFromPrefixed(cur ?? '') < 32) throw new Error('PRIVACY_PEPPER_CURRENT must be ≥32 bytes');

  const prev = env.PRIVACY_PEPPER_PREVIOUS;
  if (prev) {
    if (!isPrefixed(prev)) throw new Error('PRIVACY_PEPPER_PREVIOUS must be base64:/hex: prefixed');
    if (byteLenFromPrefixed(prev) < 32) throw new Error('PRIVACY_PEPPER_PREVIOUS must be ≥32 bytes');
  }
}
