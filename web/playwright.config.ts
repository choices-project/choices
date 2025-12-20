import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env files
// Priority order (highest to lowest): .env.local > .env.test.local > .env.test > .env
// .env.local has the highest priority as it contains all variables for local development
const envFiles = [
  { path: resolve(__dirname, '.env'), override: false },
  { path: resolve(__dirname, '.env.test'), override: false },
  { path: resolve(__dirname, '.env.test.local'), override: false },
  { path: resolve(__dirname, '.env.local'), override: true }, // Highest priority - can override everything
]

for (const { path: envFile, override } of envFiles) {
  try {
    loadDotenv({ path: envFile, override });
  } catch {
    // Ignore errors if file doesn't exist
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/archive/**', '**/setup/**'],
  fullyParallel: false, // Disabled for E2E stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0, // Disable retries in CI to prevent infinite loops on timeout failures
  workers: process.env.CI ? 1 : 2,
  reporter: 'line',
  timeout: 90_000, // Increased for CI environments where harness pages may take longer to load
  expect: { timeout: 15_000 }, // Increased for more reliable element assertions

  // Global setup - creates test users before running tests
  globalSetup: './tests/e2e/setup/global-setup.ts',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure', // Changed from 'on-first-retry' since retries are disabled
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000, // Increased for CI reliability
    navigationTimeout: 60_000, // Increased for harness page loads
    // Add E2E bypass header for middleware to recognize E2E tests
    extraHTTPHeaders: process.env.PLAYWRIGHT_USE_MOCKS === '1' || process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'
      ? { 'x-e2e-bypass': '1' }
      : {},
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
    // Use dev server for faster startup and hot reload during development
    // In CI, dev server is still used but with production-like optimizations disabled
    command: process.env.CI
      ? 'bash -c "NEXT_PUBLIC_ENABLE_E2E_HARNESS=1 PLAYWRIGHT_USE_MOCKS=1 npm run dev"'
      : 'npm run dev',
    url: `${process.env.BASE_URL ?? 'http://localhost:3000'}/api/health`, // Use health endpoint for more reliable readiness check
    reuseExistingServer: !process.env.CI,
    timeout: 300_000, // Increased to 5 minutes for CI environments
    env: {
      ...process.env,
      NEXT_DISABLE_REACT_DEV_OVERLAY: '1',
      NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET:
        process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET ?? '0',
      // CRITICAL: NEXT_PUBLIC_ vars must be set at process start for Next.js to include them in build
      NEXT_PUBLIC_ENABLE_E2E_HARNESS:
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS ?? '1',
      NEXT_DISABLE_STRICT_MODE: '1',
      // Ensure PLAYWRIGHT_USE_MOCKS is available to the dev server
      PLAYWRIGHT_USE_MOCKS: process.env.PLAYWRIGHT_USE_MOCKS ?? '1',
      // Ensure E2E harness is enabled
      ALLOWED_DEV_ORIGINS: process.env.ALLOWED_DEV_ORIGINS ?? 'http://localhost:3000',
      // Ensure NODE_ENV is development for dev server (faster startup than production build)
      NODE_ENV: 'development',
    },
  },
})
