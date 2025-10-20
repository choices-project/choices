import { defineConfig, devices } from '@playwright/test';

/**
 * Main Playwright Configuration - Inline Reporting
 * 
 * This is the primary Playwright configuration with inline reporting
 * to prevent hanging on HTML reports.
 * 
 * Created: January 27, 2025
 * Status: ✅ MAIN CONFIGURATION
 */

export default defineConfig({
  testDir: '../e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // INLINE REPORTING ONLY - NO HTML, NO HANGING
  reporter: [
    ['list'], // Inline list reporter - shows results immediately
    ['json', { outputFile: 'test-results-inline.json' }], // JSON for parsing
    ['junit', { outputFile: 'test-results-inline.xml' }] // JUnit for CI
  ],
  
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
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
    {
      name: 'firefox-inline',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': true,
            'dom.push.enabled': true,
          },
        }
      },
    },
    {
      name: 'webkit-inline',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'mobile-chrome-inline',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Timeout configuration
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});