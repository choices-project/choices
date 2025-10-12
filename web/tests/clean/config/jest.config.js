/**
 * Jest Configuration for Clean Testing Infrastructure
 * 
 * Comprehensive Jest configuration for:
 * - Unit tests (React components, API routes, utilities)
 * - Integration tests (Store interactions, feature flows)
 * - Performance tests (Rendering, API response times)
 * - Error prevention tests (Type safety, validation)
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/clean/config/jest.setup.js'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/clean/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/clean/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/clean/performance/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/clean/error-prevention/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Component-specific thresholds
    './tests/clean/unit/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // API-specific thresholds
    './tests/clean/unit/api/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Store-specific thresholds
    './tests/clean/unit/stores/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/clean/config/global-setup.js',
  globalTeardown: '<rootDir>/tests/clean/config/global-teardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],
  
  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/tests/',
    '<rootDir>/public/',
    '<rootDir>/styles/',
    '<rootDir>/types/',
    '<rootDir>/utils/',
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Custom reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
  
  // Performance testing configuration
  maxWorkers: '50%',
  
  // Memory management
  forceExit: true,
  detectOpenHandles: true,
  
  // Custom matchers
  setupFilesAfterEnv: ['<rootDir>/tests/clean/config/jest.setup.js'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
