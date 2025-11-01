import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/archive-old/**'],
  fullyParallel: false, // Disabled for E2E stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries
  workers: process.env.CI ? 1 : 2,
  reporter: 'line',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  // Use existing dev server instead of starting new one
  // webServer: {
  //   command: 'bash -c "npm run build && npm run start -- -p 3000"',
  //   port: 3000,
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },

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

  // No webServer - assuming dev server is already running on port 3000
})