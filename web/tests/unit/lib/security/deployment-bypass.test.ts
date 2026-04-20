import {
  allowAdminE2EHarness,
  allowAuthRateLimitTestBypass,
  allowCsrfValidationBypass,
  allowHarnessEmptyPublicFallback,
  isDeclaredNonVercelProduction,
  isProductionDeploymentForBypasses,
  isVercelProduction,
} from '@/lib/security/deployment-bypass';

describe('deployment-bypass', () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it('isVercelProduction is true only when VERCEL_ENV is production', () => {
    delete process.env.VERCEL_ENV;
    expect(isVercelProduction()).toBe(false);
    process.env.VERCEL_ENV = 'preview';
    expect(isVercelProduction()).toBe(false);
    process.env.VERCEL_ENV = 'production';
    expect(isVercelProduction()).toBe(true);
  });

  it('isDeclaredNonVercelProduction reads CHOICES_DEPLOYMENT_ENV', () => {
    delete process.env.CHOICES_DEPLOYMENT_ENV;
    expect(isDeclaredNonVercelProduction()).toBe(false);
    process.env.CHOICES_DEPLOYMENT_ENV = 'staging';
    expect(isDeclaredNonVercelProduction()).toBe(false);
    process.env.CHOICES_DEPLOYMENT_ENV = 'production';
    expect(isDeclaredNonVercelProduction()).toBe(true);
  });

  it('isProductionDeploymentForBypasses combines Vercel and declared prod', () => {
    delete process.env.VERCEL_ENV;
    delete process.env.CHOICES_DEPLOYMENT_ENV;
    expect(isProductionDeploymentForBypasses()).toBe(false);

    process.env.VERCEL_ENV = 'production';
    expect(isProductionDeploymentForBypasses()).toBe(true);

    delete process.env.VERCEL_ENV;
    process.env.CHOICES_DEPLOYMENT_ENV = 'production';
    expect(isProductionDeploymentForBypasses()).toBe(true);
  });

  it('allowAdminE2EHarness is false on Vercel production even when harness flag true', () => {
    process.env.VERCEL_ENV = 'production';
    expect(allowAdminE2EHarness(true)).toBe(false);
    expect(allowAdminE2EHarness(false)).toBe(false);
  });

  it('allowAdminE2EHarness is true when harness and not production deploy', () => {
    delete process.env.VERCEL_ENV;
    delete process.env.CHOICES_DEPLOYMENT_ENV;
    expect(allowAdminE2EHarness(true)).toBe(true);
    expect(allowAdminE2EHarness(false)).toBe(false);
  });

  it('allowAuthRateLimitTestBypass mirrors production gate', () => {
    process.env.VERCEL_ENV = 'production';
    expect(allowAuthRateLimitTestBypass(true)).toBe(false);
    delete process.env.VERCEL_ENV;
    expect(allowAuthRateLimitTestBypass(true)).toBe(true);
  });

  it('allowHarnessEmptyPublicFallback mirrors production gate', () => {
    process.env.VERCEL_ENV = 'production';
    expect(allowHarnessEmptyPublicFallback(true)).toBe(false);
    delete process.env.VERCEL_ENV;
    expect(allowHarnessEmptyPublicFallback(true)).toBe(true);
  });

  describe('allowCsrfValidationBypass', () => {
    it('never allows on Vercel production', () => {
      process.env.VERCEL_ENV = 'production';
      delete process.env.NODE_ENV;
      delete process.env.E2E;
      delete process.env.CI;
      delete process.env.PLAYWRIGHT_USE_MOCKS;
      const req = new Request('https://example.com/api/x', {
        method: 'POST',
        headers: { 'x-e2e-bypass': '1', 'x-csrf-token': 'x' },
      });
      expect(allowCsrfValidationBypass(req)).toBe(false);
    });

    it('allows NODE_ENV=test without header', () => {
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = 'test';
      const req = new Request('https://example.com/api/x', { method: 'POST' });
      expect(allowCsrfValidationBypass(req)).toBe(true);
    });

    it('allows E2E=1', () => {
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = 'development';
      process.env.E2E = '1';
      const req = new Request('https://example.com/api/x', { method: 'POST' });
      expect(allowCsrfValidationBypass(req)).toBe(true);
    });

    it('allows x-e2e-bypass only with CI or PLAYWRIGHT_USE_MOCKS', () => {
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      delete process.env.CI;
      delete process.env.PLAYWRIGHT_USE_MOCKS;

      const reqBypass = new Request('https://example.com/api/x', {
        method: 'POST',
        headers: { 'x-e2e-bypass': '1' },
      });
      expect(allowCsrfValidationBypass(reqBypass)).toBe(false);

      process.env.CI = 'true';
      expect(allowCsrfValidationBypass(reqBypass)).toBe(true);

      delete process.env.CI;
      process.env.PLAYWRIGHT_USE_MOCKS = '1';
      expect(allowCsrfValidationBypass(reqBypass)).toBe(true);
    });
  });
});
