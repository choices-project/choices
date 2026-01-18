import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env files
// Priority order (highest to lowest): .env.local > .env.test.local > .env.test > .env
// .env.local has the highest priority as it contains all variables for local development
const envFiles = [
  { path: resolve(__dirname, '.env'), override: false },
  { path: resolve(__dirname, '.env.test'), override: false },
  { path: resolve(__dirname, '.env.test.local'), override: false },
  { path: resolve(__dirname, '.env.local'), override: true }, // Highest priority - can override everything
];

for (const { path: envFile, override } of envFiles) {
  try {
    loadDotenv({ path: envFile, override });
  } catch {
    // Ignore errors if file doesn't exist
  }
}

// Force production defaults regardless of local .env overrides.
process.env.BASE_URL = 'https://www.choices-app.com';
process.env.PLAYWRIGHT_USE_MOCKS = '0';

export default defineConfig({
    testDir: './tests/e2e',
    testIgnore: ['**/_archived/**', '**/archive/**', '**/setup/**'],
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
    userAgent: 'ChoicesE2E/1.0 (+playwright)',
    // Do NOT set x-e2e-bypass header for production tests
    // This header bypasses authentication checks, but production tests need to test real auth flow
    // extraHTTPHeaders: { 'x-e2e-bypass': '1' },
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
