/**
 * Jest CI Configuration
 * 
 * Configuration optimized for CI/CD environments
 * - Faster execution
 * - Better error reporting
 * - Coverage collection
 */

const baseConfig = require('./jest.config.main.js');

module.exports = {
  ...baseConfig,
  
  // CI-specific overrides
  testTimeout: 30000,
  maxWorkers: 2,
  
  // Coverage collection
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Verbose output for CI
  verbose: true,
  
  // Fail fast on CI
  bail: 1,
};
