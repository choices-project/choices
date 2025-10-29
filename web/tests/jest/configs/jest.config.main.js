const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Comprehensive Jest Configuration for Choices Platform
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/../../setup/jest.setup.js'
  ],
  testEnvironment: 'jest-environment-jsdom',
  
  // Test patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/playwright/',
    '<rootDir>/archive/',
    '<rootDir>/archive-*/',
    '<rootDir>/app/archive-*/',
    '<rootDir>/_reports/',
    '<rootDir>/tests/e2e/archive-old/',
    '<rootDir>/archive-unused-files/',
  ],
  
  testMatch: [
    '<rootDir>/tests/jest/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/jest/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
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
    '!**/archive-*/**',
    '!**/app/archive-*/**',
    '!**/_reports/**',
    '!**/tests/e2e/archive-old/**',
    '!**/archive-unused-files/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|@radix-ui|@headlessui|@floating-ui|@tanstack|@supabase|framer-motion|recharts|uuid|clsx|tailwind-merge)/)',
  ],
  
  // Transform configuration for ESM modules
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.mjs$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module name mapping
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
    '^lucide-react/(.*)$': '<rootDir>/__mocks__/lucide-react.js',
  },
  
  // Transform configuration
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\.mjs$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Test timeout
  testTimeout: 15000,
  
  // Verbose output
  verbose: false,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Global setup - removed non-existent files
  // globalSetup: '<rootDir>/jest.global-setup.js',
  // globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Test results processor - removed non-existent files
  // testResultsProcessor: '<rootDir>/jest.results-processor.js',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/playwright-report/',
    '/test-results/',
    '/archive/',
    '/archive-*/',
    '/app/archive-*/',
    '/_reports/',
    '/tests/e2e/archive-old/',
    '/archive-unused-files/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Snapshot serializers
  snapshotSerializers: ['@testing-library/jest-dom'],
  
  // Setup files - removed non-existent files
  // setupFiles: ['<rootDir>/jest.env.setup.js'],
  
  // Globals for TypeScript
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

module.exports = createJestConfig(customJestConfig)