/**
 * Jest Global Teardown
 * 
 * Created: October 18, 2025
 * Updated: October 18, 2025
 * 
 * Global teardown for Jest tests - runs once after all tests
 */

module.exports = async () => {
  // Clean up global test resources
  const testDuration = Date.now() - global.__TEST_START_TIME__;
  console.log(`🧪 Jest Global Teardown: Tests completed in ${testDuration}ms`);
  
  // Clean up any global resources
  if (global.__TEST_START_TIME__) {
    delete global.__TEST_START_TIME__;
  }
};
