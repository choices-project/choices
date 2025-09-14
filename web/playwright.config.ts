import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'tests/e2e/.storage/admin.json', // pre-auth state
    extraHTTPHeaders: { 'x-e2e-bypass': '1' } // bypass rate limiting
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  // Dev locally, build+start on CI
  webServer: {
    command: isCI ? 'E2E=1 npm run build && E2E=1 npm start' : 'E2E=1 npm run dev',
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      E2E: '1',
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-dev-key',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || 'dev-only-secret'
    }
  },

  globalSetup: './tests/e2e/setup/global-setup.ts'
});
