import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/archive/**', '**/setup/**'],
  fullyParallel: false, // Disabled for E2E stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries
  workers: process.env.CI ? 1 : 2,
  reporter: 'line',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Global setup - creates test users before running tests
  globalSetup: './tests/e2e/setup/global-setup.ts',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
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
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_DISABLE_REACT_DEV_OVERLAY: '1',
      NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET:
        process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET ?? '0',
      NEXT_PUBLIC_ENABLE_E2E_HARNESS:
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS ?? '1',
      NEXT_DISABLE_STRICT_MODE: '1',
    },
  },
})
