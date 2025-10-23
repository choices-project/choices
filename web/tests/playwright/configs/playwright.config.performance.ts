import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Performance Testing Configuration
 * 
 * Optimized for performance testing with tracing and HAR files
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

export default defineConfig({
  testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: '/Users/alaughingkitsune/src/Choices/web/test-results/performance-results.json' }],
    ['junit', { outputFile: '/Users/alaughingkitsune/src/Choices/web/test-results/performance-results.xml' }]
  ],
  
  // Environment variables for tests
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Performance testing specific settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Enable HAR recording for network analysis
    // recordHar: {
    //   mode: 'full',
    //   urlFilter: '**/*',
    //   omitContent: false
    // }
  },

  projects: [
    {
      name: 'chromium-performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance testing specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
    },
    {
      name: 'firefox-performance',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
    },
    {
      name: 'webkit-performance',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    // Mobile performance testing
    {
      name: 'mobile-chrome-performance',
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
    {
      name: 'mobile-safari-performance',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Performance testing specific configuration
  expect: {
    timeout: 10000,
  },

  // Global setup for performance testing
  globalSetup: require.resolve('./global-setup-performance.ts'),
  globalTeardown: require.resolve('./global-teardown-performance.ts'),
});
