import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // Reduced retries in staging to speed up CI - failures will still be visible
    retries: process.env.CI ? 1 : 0,
    reporter: [
      ['html', { outputFolder: 'playwright-report-staging', open: 'never' }],
      ['junit', { outputFile: 'test-results-staging/results.xml' }]
    ],
    timeout: 120_000, // Increased for staging environment reliability (network latency, cold starts)
    expect: { timeout: 30_000 }, // Increased for more reliable element assertions in staging

  use: {
    baseURL: 'https://choices-platform-staging.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' },
    actionTimeout: 30_000, // Increased for staging reliability
    navigationTimeout: 90_000, // Increased for harness page loads in staging
  },

  projects: [
    // Only run chromium in staging for faster CI - firefox/webkit tested in local dev
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // No webServer needed for staging - it's already deployed
  // Use 2 workers in CI to parallelize tests while avoiding resource contention
  ...(process.env.CI ? { workers: 2 } : {}),
});
