import { defineConfig, devices } from '@playwright/test';

/**
 * Progress Bar Configuration
 * 
 * Simple configuration with visual progress bar for development
 * - Chrome only for speed
 * - Progress bar reporter for visual feedback
 * - Minimal overhead
 * 
 * Created: January 27, 2025
 * Status: ✅ OPTIMIZED FOR PROGRESS VISUALIZATION
 */

export default defineConfig({
  testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e',
  fullyParallel: false, // Sequential for easier progress tracking
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  
  // Progress bar reporting
  reporter: [
    ['line'], // Line reporter with dots for progress
    ['json', { outputFile: '/Users/alaughingkitsune/src/Choices/web/test-results/playwright/test-results-progress.json' }], // JSON for parsing
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'chromium-progress',
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
