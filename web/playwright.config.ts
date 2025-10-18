import { defineConfig, devices } from '@playwright/test';

/**
 * Optimized Playwright Configuration for Choices Platform
 * 
 * This is our single, consolidated Playwright configuration that replaces
 * all the redundant configs we had before. It's optimized for performance
 * and provides comprehensive testing coverage.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

export default defineConfig({
  testDir: './tests/playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : 4, // Optimized for parallel execution
  reporter: 'line',
  timeout: 30000, // 30 second timeout for individual tests
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 second timeout for actions
    navigationTimeout: 15000, // 15 second timeout for navigation
  },
  projects: [
    // Fast tests - Critical browsers only
    {
      name: 'chromium-fast',
      testMatch: [
        '**/basic-navigation.spec.ts',
        '**/authentication.spec.ts',
        '**/admin-dashboard.spec.ts'
      ],
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
    {
      name: 'firefox-fast',
      testMatch: [
        '**/basic-navigation.spec.ts',
        '**/authentication.spec.ts',
        '**/admin-dashboard.spec.ts'
      ],
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': true,
            'dom.push.enabled': true,
          },
        },
      },
    },
    // Medium tests - Core functionality
    {
      name: 'chromium-medium',
      testMatch: [
        '**/poll-creation.spec.ts',
        '**/voting-system.spec.ts',
        '**/onboarding-flow.spec.ts'
      ],
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
        },
      },
    },
    // Comprehensive tests - Performance focused
    {
      name: 'chromium-comprehensive',
      testMatch: [
        '**/performance-challenges.spec.ts',
        '**/security-challenges.spec.ts',
        '**/accessibility-challenges.spec.ts',
        '**/accessibility-public-pages.spec.ts',
        '**/edge-case-challenges.spec.ts',
        '**/data-integrity-challenges.spec.ts',
        '**/performance-public-pages.spec.ts'
      ],
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
        },
      },
    },
  ],
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true, // Always reuse existing server
  //   timeout: 60000, // 1 minute timeout for server startup
  // },
});