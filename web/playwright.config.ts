import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/archive/**', '**/setup/**'],
  fullyParallel: false, // Disabled for E2E stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0, // Disable retries in CI to prevent infinite loops on timeout failures
  workers: process.env.CI ? 1 : 2,
  reporter: 'line',
  timeout: 60_000, // Increased for CI environments where harness pages may take longer to load
  expect: { timeout: 10_000 }, // Increased for more reliable element assertions

  // Global setup - creates test users before running tests
  globalSetup: './tests/e2e/setup/global-setup.ts',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure', // Changed from 'on-first-retry' since retries are disabled
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000, // Increased for CI reliability
    navigationTimeout: 60_000, // Increased for harness page loads
  },

  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
      },
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*pwa.*\.spec\.ts/, // Exclude PWA specs to prevent duplicate runs
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pwa-tests',
      testMatch: /.*pwa.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['notifications'],
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: `${process.env.BASE_URL ?? 'http://localhost:3000'}/api/health`, // Use health endpoint for more reliable readiness check
    reuseExistingServer: !process.env.CI,
    timeout: 300_000, // Increased to 5 minutes for CI environments
    env: {
      ...process.env,
      NEXT_DISABLE_REACT_DEV_OVERLAY: '1',
      NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET:
        process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET ?? '0',
      NEXT_PUBLIC_ENABLE_E2E_HARNESS:
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS ?? '1',
      NEXT_DISABLE_STRICT_MODE: '1',
      // Ensure PLAYWRIGHT_USE_MOCKS is available to the dev server
      PLAYWRIGHT_USE_MOCKS: process.env.PLAYWRIGHT_USE_MOCKS ?? '1',
      // Ensure E2E harness is enabled
      ALLOWED_DEV_ORIGINS: process.env.ALLOWED_DEV_ORIGINS ?? 'http://localhost:3000',
      // Ensure NODE_ENV is development for dev server
      NODE_ENV: 'development',
    },
  },
})
