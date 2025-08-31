const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!lib/**/*.d.ts',
    '!**/*.config.js',
    '!**/*.config.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000, // 30 seconds for database tests
  verbose: true,
  // Memory optimization
  maxWorkers: 2, // Reduce worker count to prevent memory issues
  workerIdleMemoryLimit: '512MB', // Limit memory per worker
  // Performance optimization
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Test filtering - focus on working tests first
  testPathIgnorePatterns: [
    '/node_modules/',
    '/archive/',
    '/disabled/'
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
