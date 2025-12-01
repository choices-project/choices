import path from 'path';

import * as dotenv from 'dotenv';

import { defineConfig, devices } from '@playwright/test';

// Load environment variables from .env.local (same pattern as check-env.ts)
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '.env.local') });
dotenv.config({ path: path.join(cwd, '.env.test.local') });

/**
 * Playwright configuration for testing choices-app.com (production)
 * 
 * This configuration is designed for extensive E2E testing of the production
 * environment. It includes:
 * - Longer timeouts for production network conditions
 * - Multiple browser testing
 * - Comprehensive retry strategy
 * - Detailed reporting
 * - Automatic loading of .env.local for test credentials
 */
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/archive/**', '**/setup/**'],
  fullyParallel: false, // Sequential for production stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // More retries for production
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report-choices-app', open: 'never' }],
    ['junit', { outputFile: 'test-results-choices-app/results.xml' }],
    ['list'],
  ],
  timeout: 90_000, // Longer timeout for production
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'https://choices-app.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Production-specific headers
    extraHTTPHeaders: {
      'x-e2e-test': '1',
      'x-test-source': 'playwright-choices-app',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit disabled by default for production testing (slower, less critical)
    // Uncomment if needed:
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // No webServer needed - testing production
});

