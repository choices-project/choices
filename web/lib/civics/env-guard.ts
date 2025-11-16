// Run once at server start (import from your route/util entry point)
function isDev() {
  const env = process.env.NODE_ENV;
  return env === 'development' || env === 'test';
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

export function assertPepperConfig() {
  if (isDev()) {
    if (!process.env.PRIVACY_PEPPER_DEV) {
      throw new Error('PRIVACY_PEPPER_DEV required in dev/test');
    }
    return;
  }

  if (process.env.PRIVACY_PEPPER_DEV) {
    throw new Error('PRIVACY_PEPPER_DEV must NOT be set in preview/prod');
  }
  const cur = process.env.PRIVACY_PEPPER_CURRENT;
  if (!isPrefixed(cur)) throw new Error('PRIVACY_PEPPER_CURRENT must be base64:/hex: prefixed');
  if (byteLenFromPrefixed(cur ?? '') < 32) throw new Error('PRIVACY_PEPPER_CURRENT must be ≥32 bytes');

  const prev = process.env.PRIVACY_PEPPER_PREVIOUS;
  if (prev) {
    if (!isPrefixed(prev)) throw new Error('PRIVACY_PEPPER_PREVIOUS must be base64:/hex: prefixed');
    if (byteLenFromPrefixed(prev) < 32) throw new Error('PRIVACY_PEPPER_PREVIOUS must be ≥32 bytes');
  }
}
