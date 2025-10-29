const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Background Testing Configuration - Optimized for Continuous Execution
const backgroundJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/tests/jest/setup/supabase-mock.ts'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Background testing specific settings
  watchMode: false,
  runInBand: false, // Allow parallel execution
  maxWorkers: '75%', // Use more CPU for background testing
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache-background',
  
  // Test patterns for background execution
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/playwright/',
    '<rootDir>/archive/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/',
  ],
  
  testMatch: [
    '<rootDir>/tests/jest/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/jest/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/jest/performance/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage for background testing
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'features/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/archive/**',
  ],
  
  // Background testing thresholds (lower for continuous execution)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // Performance optimizations
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|@radix-ui|@headlessui|@floating-ui|@tanstack|@supabase|framer-motion|recharts|uuid|clsx|tailwind-merge)/)',
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
  },
  
  // Background testing specific settings
  testTimeout: 10000, // Shorter timeout for background tests
  verbose: false,
  silent: false,
  
  // Reporter for background testing
  reporters: [
    'default',
    ['jest-json-reporter', { outputPath: 'test-results-background.json' }],
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'jest-background.xml' }]
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Global setup for background testing
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage-background',
  
  // Test results processor for background monitoring
  testResultsProcessor: '<rootDir>/jest.results-processor.js',
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup files
  setupFiles: ['<rootDir>/jest.env.setup.js'],
  
  // Snapshot serializers
  snapshotSerializers: ['@testing-library/jest-dom'],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.mjs$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Globals for TypeScript
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// Wire client/server configs for background testing
backgroundJestConfig.projects = [
  '<rootDir>/jest.client.config.js',
  '<rootDir>/jest.server.config.js',
]

module.exports = createJestConfig(backgroundJestConfig)
