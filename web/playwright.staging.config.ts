import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // No webServer needed for staging - it's already deployed
  ...(process.env.CI ? { workers: 1 } : {}),
});
