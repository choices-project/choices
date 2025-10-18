const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
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
  // Performance optimizations for Jest 30.2.0
  maxWorkers: '50%', // Use half of available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Transform ignore patterns for ESM modules - optimized for React 19
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|@radix-ui|@headlessui|@floating-ui|@tanstack|@supabase|framer-motion|recharts|uuid|clsx|tailwind-merge)/)',
  ],
  // Module name mapping - optimized for React 19 and Next.js 15
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
    '^lucide-react/dist/esm/icons/(.*)$': '<rootDir>/__mocks__/lucide-react.js',
  },
  // Force transform ESM modules for React 19 compatibility
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.mjs$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Test timeout - increased for React 19
  testTimeout: 15000,
  // Verbose output for debugging
  verbose: false,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetMocks: true,
  // Restore mocks after each test
  restoreMocks: true,
  // React 19 specific configuration
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Test environment options for React 19
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Snapshot serializers for React 19
  snapshotSerializers: ['@testing-library/jest-dom'],
  // Setup files
  setupFiles: ['<rootDir>/jest.env.setup.js'],
  // Global setup
  globalSetup: '<rootDir>/jest.global-setup.js',
  // Global teardown
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  // Test results processor
  testResultsProcessor: '<rootDir>/jest.results-processor.js',
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  // Coverage directory
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
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)