import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Sequential for monitoring
  reporter: [
    ['html', { outputFolder: 'playwright-report-monitoring', open: 'never' }],
    ['junit', { outputFile: 'test-results-monitoring/results.xml' }]
  ],
  timeout: 120_000, // Longer timeout for monitoring
  expect: { timeout: 30_000 },

  use: {
    baseURL: process.env.BASE_URL || 'https://choices-platform.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' }
  },

  projects: [
    { 
      name: 'monitoring', 
      use: { 
        ...devices['Desktop Chrome'],
        // Add monitoring-specific settings
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      } 
    },
  ],

  // No webServer needed for monitoring - it's already deployed
});
