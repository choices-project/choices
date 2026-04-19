import { env } from '@/lib/config/env';

/**
 * Skip Upstash-style HTTP rate limits only in explicit test modes.
 * Production must never set PLAYWRIGHT_USE_MOCKS=0 to mean "tests" — unset is not a test signal.
 */
export function shouldBypassAuthRateLimitsInTestModes(): boolean {
  return (
    env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' ||
    env.PLAYWRIGHT_USE_MOCKS === '1'
  );
}
