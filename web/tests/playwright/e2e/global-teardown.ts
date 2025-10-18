import type { FullConfig } from '@playwright/test';

/**
 * Global Teardown for Cross-Browser Testing
 * 
 * Cleans up the testing environment after cross-browser testing including:
 * - Test data cleanup
 * - Report generation
 * - Environment cleanup
 */
async function globalTeardown(config: FullConfig) {
  console.log('🌐 Starting global teardown for cross-browser testing...');
  
  // Generate cross-browser test summary
  const testData = process.env.CROSS_BROWSER_TEST_DATA ? 
    JSON.parse(process.env.CROSS_BROWSER_TEST_DATA) : null;
  
  if (testData) {
    console.log(`🌐 Cross-browser testing completed for browsers: ${testData.browsers.join(', ')}`);
    console.log(`🌐 Test environment: ${testData.environment}`);
    console.log(`🌐 CI mode: ${testData.ci ? 'Yes' : 'No'}`);
  }
  
  // Clean up any temporary files or data
  try {
    // Remove any temporary test data
    const fs = require('fs');
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp-cross-browser');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🌐 Temporary cross-browser test data cleaned up');
    }
  } catch (error) {
    console.log(`⚠️ Error cleaning up temporary data: ${error}`);
  }
  
  console.log('🌐 Cross-browser testing environment cleaned up');
}

export default globalTeardown;




