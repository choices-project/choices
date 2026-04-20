/**
 * Single source of truth for when test/E2E-only behavior may relax security.
 * All sensitive bypasses (CSRF, admin harness, auth rate-limit skips, etc.)
 * must consult these helpers so Vercel production cannot be weakened by env mistakes.
 */

/** Vercel production deployments (customer-facing). */
export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Self-hosted or other prod when explicitly marked (no VERCEL_ENV).
 * Set `CHOICES_DEPLOYMENT_ENV=production` on non-Vercel production hosts.
 */
export function isDeclaredNonVercelProduction(): boolean {
  return process.env.CHOICES_DEPLOYMENT_ENV === 'production';
}

/** True on any deployment we treat as "real production" for security bypass purposes. */
export function isProductionDeploymentForBypasses(): boolean {
  return isVercelProduction() || isDeclaredNonVercelProduction();
}

/**
 * Admin / E2E harness mock user — only outside real production.
 * Requires harness flag in addition (see callers).
 */
export function allowAdminE2EHarness(harnessEnabled: boolean): boolean {
  return harnessEnabled && !isProductionDeploymentForBypasses();
}

/**
 * Skip Upstash-style auth rate limits in harness/mocks — only outside real production.
 */
export function allowAuthRateLimitTestBypass(
  harnessOrMocks: boolean,
): boolean {
  return harnessOrMocks && !isProductionDeploymentForBypasses();
}

/**
 * CSRF validation bypass for tests and local E2E.
 * Never on production deployment; `x-e2e-bypass` alone is never enough without server test signals.
 */
export function allowCsrfValidationBypass(request: Request): boolean {
  if (isProductionDeploymentForBypasses()) {
    return false;
  }

  // `ProcessEnv.NODE_ENV` typing omits `test`; Jest sets NODE_ENV=test at runtime.
  const nodeEnvRaw = String(process.env.NODE_ENV ?? '');

  if (nodeEnvRaw === 'test' || process.env.E2E === '1') {
    return true;
  }

  if (request.headers.get('x-e2e-bypass') === '1') {
    return (
      process.env.CI === 'true' ||
      process.env.PLAYWRIGHT_USE_MOCKS === '1' ||
      nodeEnvRaw === 'test' ||
      process.env.E2E === '1'
    );
  }

  return false;
}

/**
 * Harness/mocks empty fallbacks (e.g. public site messages) — never on production deployment.
 */
export function allowHarnessEmptyPublicFallback(
  harnessOrMocks: boolean,
): boolean {
  return harnessOrMocks && !isProductionDeploymentForBypasses();
}
