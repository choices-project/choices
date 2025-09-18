import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3001', // avoid localhost oddities
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'ui-tests',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
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

  webServer: {
    command: 'NODE_ENV=production next build && NODE_ENV=production next start -p 3001',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})