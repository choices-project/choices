import { defineConfig, devices } from '@playwright/test';

/**
 * Iterative Development Configuration with Visual Monitoring
 * 
 * Optimized for user/admin journey development with visual feedback
 * - Chrome only for speed
 * - Video recording for debugging
 * - Screenshots on failure
 * - Tracing for detailed analysis
 * 
 * Created: January 27, 2025
 * Status: ✅ OPTIMIZED FOR ITERATIVE DEVELOPMENT
 */

export default defineConfig({
  testDir: '/Users/alaughingkitsune/src/Choices/web/tests/playwright/e2e',
  fullyParallel: false, // Sequential for easier debugging
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  
  // Enhanced reporting for iterative development
  reporter: [
    ['list'], // Inline list reporter - shows results immediately
    ['progress'], // Progress bar reporter - shows visual progress
    ['json', { outputFile: 'test-results-iterative.json' }], // JSON for parsing
    ['html', { outputDir: 'test-results-iterative' }], // HTML for visual review
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // Detailed tracing for debugging
    screenshot: 'only-on-failure', // Screenshots when tests fail
    video: 'retain-on-failure', // Video recording for debugging
    actionTimeout: 15000, // Longer timeout for debugging
    navigationTimeout: 30000, // Longer timeout for debugging
  },
  
  // Environment variables for tests
  
  projects: [
    {
      name: 'chromium-iterative',
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
        // Enhanced visual monitoring for iterative development
        contextOptions: {
          recordVideo: {
            dir: 'test-results-iterative/videos/',
            size: { width: 1280, height: 720 }
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
  
  // Timeout configuration for iterative development
  timeout: 90 * 1000, // 90 seconds for comprehensive debugging
  expect: {
    timeout: 15 * 1000, // 15 seconds for assertions
  },
});
