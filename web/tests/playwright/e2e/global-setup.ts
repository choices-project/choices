import type { FullConfig } from '@playwright/test';

/**
 * Global Setup for Cross-Browser Testing
 * 
 * Sets up the testing environment for cross-browser testing including:
 * - Browser installation verification
 * - Test data preparation
 * - Environment configuration
 */
async function globalSetup(config: FullConfig) {
  console.log('🌐 Starting global setup for cross-browser testing...');
  
  // Verify browser installations
  const browsers = ['chromium', 'firefox', 'webkit'];
  const installedBrowsers = [];
  
  for (const browser of browsers) {
    try {
      // Check if browser is installed
      const { execSync } = require('child_process');
      execSync(`npx playwright install ${browser}`, { stdio: 'ignore' });
      installedBrowsers.push(browser);
      console.log(`✅ ${browser} browser verified`);
    } catch (error) {
      console.log(`⚠️ ${browser} browser installation issue: ${error}`);
    }
  }
  
  console.log(`🌐 Installed browsers: ${installedBrowsers.join(', ')}`);
  
  // Set up test data for cross-browser testing
  const testData = {
    browsers: installedBrowsers,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    ci: !!process.env.CI
  };
  
  // Store test data for use in tests
  process.env.CROSS_BROWSER_TEST_DATA = JSON.stringify(testData);
  
  console.log('🌐 Cross-browser testing environment ready');
}

export default globalSetup;




