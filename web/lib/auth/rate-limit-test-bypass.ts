import { env } from '@/lib/config/env';
import { allowAuthRateLimitTestBypass } from '@/lib/security/deployment-bypass';

/**
 * Skip Upstash-style HTTP rate limits only in explicit test modes.
 * Production must never set PLAYWRIGHT_USE_MOCKS=0 to mean "tests" — unset is not a test signal.
 *
 * CSRF validation uses a different bypass (`validateCsrfProtection` in `app/api/auth/_shared/csrf.ts`):
 * harness/mocks env flags plus `x-e2e-bypass` / `NODE_ENV === 'test'` / `E2E=1`. Keep rate-limit skips here only.
 */
export function shouldBypassAuthRateLimitsInTestModes(): boolean {
  const harnessOrMocks =
    env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' ||
    env.PLAYWRIGHT_USE_MOCKS === '1';
  return allowAuthRateLimitTestBypass(harnessOrMocks);
}
