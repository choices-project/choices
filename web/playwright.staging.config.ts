import { defineConfig, devices } from '@playwright/test';
import { withOptional } from './lib/util/objects';

export default defineConfig(withOptional(
  {
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
      ['html', { outputFolder: 'playwright-report-staging', open: 'never' }],
      ['junit', { outputFile: 'test-results-staging/results.xml' }]
    ],
    timeout: 60_000,
    expect: { timeout: 10_000 },

  use: {
    baseURL: 'https://choices-platform-staging.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' }
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

    // No webServer needed for staging - it's already deployed
  },
  {
    workers: process.env.CI ? 1 : undefined
  }
));
