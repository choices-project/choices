import { createHash } from 'node:crypto';

import type { NextResponse } from 'next/server';

type CacheScope = 'public' | 'private';

type AnalyticsCacheHeaderOptions = {
  /**
   * Primary cache key used to derive deterministic ETags.
   */
  cacheKey?: string;
  /**
   * Optional seed appended to the cache key when computing the ETag.
   */
  etagSeed?: string;
  /**
   * Cache TTL (seconds). Defaults to 300.
   */
  ttlSeconds?: number;
  /**
   * Optional explicit stale-while-revalidate window (seconds).
   * Falls back to ttlSeconds * 2 when omitted.
   */
  staleWhileRevalidateSeconds?: number;
  /**
   * Cache scope. Defaults to `public`.
   */
  scope?: CacheScope;
};

const DEFAULT_TTL_SECONDS = 300;

const quoteETag = (value: string) => `"${value}"`;

export function applyAnalyticsCacheHeaders(
  response: NextResponse,
  options: AnalyticsCacheHeaderOptions = {}
): NextResponse {
  const ttlSeconds = Math.max(options.ttlSeconds ?? DEFAULT_TTL_SECONDS, 0);
  const staleSeconds =
    options.staleWhileRevalidateSeconds ??
    Math.max(ttlSeconds * 2, ttlSeconds + 60);

  const scope = options.scope ?? 'public';
  const cacheControl =
    ttlSeconds === 0
      ? 'no-store'
      : `${scope}, max-age=${ttlSeconds}, stale-while-revalidate=${staleSeconds}`;

  response.headers.set('Cache-Control', cacheControl);

  const etagBase =
    options.etagSeed ??
    options.cacheKey ??
    `${Date.now()}:${Math.random().toString(36).slice(2)}`;

  const hash = createHash('sha256').update(etagBase).digest('hex');
  response.headers.set('ETag', quoteETag(hash));

  return response;
}


