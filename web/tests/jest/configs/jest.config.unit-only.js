/**
 * Jest Unit-Only Configuration
 *
 * Configuration for running only unit tests (business logic)
 * Excludes integration and E2E tests
 */

const baseConfig = require('./jest.config.main.js');

module.exports = {
  ...baseConfig,

  // Only run unit tests
  testMatch: [
    '<rootDir>/tests/jest/unit/**/*.test.{ts,tsx}',
  ],

  // Exclude integration tests
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/playwright/',
    '<rootDir>/archive/',
    '<rootDir>/archive-*/',
    '<rootDir>/app/archive-*/',
    '<rootDir>/_reports/',
    '<rootDir>/tests/jest/integration/',
  ],

  // Faster execution for unit tests
  maxWorkers: '50%',
  testTimeout: 10000,
};
