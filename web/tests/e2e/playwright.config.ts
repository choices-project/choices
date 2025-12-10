import { defineConfig, devices } from '@playwright/test'

// Separate config for auth-production tests
// This config starts the production server manually (via workflow) instead of using webServer
export default defineConfig({
  testDir: './specs',
  testIgnore: ['**/archive/**', '**/setup/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for production tests
  workers: 1,
  reporter: 'line',
  timeout: 120_000, // Longer timeout for production server
  expect: { timeout: 30_000 },

  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer - server is started manually in the workflow
})
