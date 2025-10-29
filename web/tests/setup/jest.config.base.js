/**
 * Base Jest Configuration
 * Provides type-safe testing foundation for all test files
 */

module.exports = {
  // Use our test utilities
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // TypeScript support
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx}',
  ],
  
  // Coverage
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        noImplicitAny: false, // Allow any in tests
        skipLibCheck: true,
      },
    },
  },
};
