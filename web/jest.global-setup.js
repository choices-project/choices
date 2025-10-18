/**
 * Jest Global Setup
 * 
 * Created: October 18, 2025
 * Updated: October 18, 2025
 * 
 * Global setup for Jest tests - runs once before all tests
 */

module.exports = async () => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Set up test database connection if needed
  console.log('🧪 Jest Global Setup: Test environment initialized');
  
  // Initialize any global test resources
  global.__TEST_START_TIME__ = Date.now();
};
