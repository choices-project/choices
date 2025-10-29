import { defineConfig, devices } from '@playwright/test';

/**
 * Chrome-Only Playwright Configuration
 * 
 * Fast configuration for iterative development - Chrome only
 * to reduce test execution time from 300+ tests to manageable chunks.
 * 
 * Created: January 27, 2025
 * Status: ✅ CHROME-ONLY FOR ITERATIVE DEVELOPMENT
 */

export default defineConfig({
  testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e',
  fullyParallel: false, // Sequential for easier debugging
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  
  // INLINE REPORTING ONLY - NO HTML, NO HANGING
  reporter: [
    ['list'], // Inline list reporter - shows results immediately
    ['json', { outputFile: 'test-results-chrome-only.json' }], // JSON for parsing
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // E2E bypass headers for middleware
    extraHTTPHeaders: {
      'x-e2e-bypass': '1',
    },
  },
  
  projects: [
    {
      name: 'chromium-inline',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        }
      },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Timeout configuration
  timeout: 60 * 1000, // 60 seconds for comprehensive tests
  expect: {
    timeout: 10 * 1000,
  },
});
