import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3001', // use existing dev server
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e-bypass': '1' },
  },

  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3001',
      },
    },
    {
      name: 'ui-tests',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pwa-tests',
      testMatch: /.*pwa.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // PWA-specific settings
        permissions: ['notifications'],
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
      },
    },
    {
      name: 'pwa-mobile-tests',
      testMatch: /.*pwa.*\.spec\.ts/,
      use: { 
        ...devices['Pixel 5'],
        // Mobile PWA-specific settings
        permissions: ['notifications'],
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
      },
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['iPhone 12'] },
    },
  ],

  // No webServer - assuming dev server is already running on port 3000
})