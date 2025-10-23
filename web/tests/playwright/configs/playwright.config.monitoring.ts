import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Enhanced reporting for visual monitoring - NO HTML to prevent hanging
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results-monitoring.json' }],
    ['junit', { outputFile: 'test-results-monitoring.xml' }],
    ['github']
  ],
  
  use: {
    // Enhanced tracing for performance monitoring
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
    
    // Performance monitoring
    launchOptions: {
      slowMo: 0,
    },
  },
  
  projects: [
    {
      name: 'chromium-monitoring',
      use: { 
        ...devices['Desktop Chrome'],
        // Enhanced performance monitoring
        contextOptions: {
          recordVideo: {
            dir: '/Users/alaughingkitsune/src/Choices/web/test-results/videos/',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },
    {
      name: 'firefox-monitoring',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          recordVideo: {
            dir: '/Users/alaughingkitsune/src/Choices/web/test-results/videos/',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },
    {
      name: 'webkit-monitoring',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          recordVideo: {
            dir: '/Users/alaughingkitsune/src/Choices/web/test-results/videos/',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },
    {
      name: 'mobile-monitoring',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          recordVideo: {
            dir: '/Users/alaughingkitsune/src/Choices/web/test-results/videos/',
            size: { width: 390, height: 844 }
          }
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
  
  // Global setup for monitoring
  globalSetup: require.resolve('./global-setup-monitoring.ts'),
  globalTeardown: require.resolve('./global-teardown-monitoring.ts'),
  
  // Timeout configuration
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});
