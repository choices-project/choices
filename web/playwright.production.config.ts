import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // Reduced retries to speed up CI - failures will still be visible with 1 retry
    retries: process.env.CI ? 1 : 0,
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
    extraHTTPHeaders: { 'x-e2e-bypass': '1' },
  },

  projects: [
    // Only run chromium in production CI for speed - firefox/webkit tested in local dev
    // This reduces test time by 66% (3 browsers -> 1 browser)
    { 
      name: 'chromium', 
      use: { 
        ...devices['Desktop Chrome'],
        // Disable service workers to speed up tests - they intercept network requests and slow execution
        // Service workers can cause delays in test execution as they handle network interception
        launchOptions: {
          args: ['--disable-service-worker-registration']
        },
      } 
    },
    // Uncomment below to test other browsers (slower but more comprehensive)
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // No webServer needed for production - it's already deployed
  // Increase workers for parallelization - 4 workers = ~4x faster execution
  // Playwright will automatically adjust if system resources are limited
  ...(process.env.CI ? { workers: 4 } : { workers: 2 }),
});
