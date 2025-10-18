import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for resilience testing
 * Tests system resilience, failover, and recovery scenarios
 */

export default defineConfig({
  testDir: './tests/resilience',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/resilience-results.json' }],
    ['junit', { outputFile: 'test-results/resilience-results.xml' }]
  ],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Extended timeouts for resilience testing
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  timeout: 60000, // 1 minute timeout for resilience tests
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
  projects: [
    {
      name: 'resilience-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'resilience-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'resilience-webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'resilience-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for server startup
  },
  // Environment variables for resilience testing
  env: {
    RESILIENCE_TESTING: 'true',
    FAILOVER_TESTING: 'true',
    TIMEOUT_TESTING: 'true',
  },
});

