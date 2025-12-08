import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
      ['html', { outputFolder: 'playwright-report-production', open: 'never' }],
      ['junit', { outputFile: 'test-results-production/results.xml' }]
    ],
    timeout: 60_000,
    expect: { timeout: 10_000 },

  use: {
    baseURL: 'https://www.choices-app.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' }
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // No webServer needed for production - it's already deployed
  ...(process.env.CI ? { workers: 1 } : {}),
});
