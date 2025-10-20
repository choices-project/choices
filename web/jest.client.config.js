/**
 * Jest Client Configuration
 * 
 * Updated module resolution for reorganized file structure.
 * Ensures Jest can resolve all aliases correctly for client-side tests.
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'client',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/tests/jest/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    // Updated aliases for reorganized structure
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/supabase/server$': '<rootDir>/utils/supabase/server',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    // Dedicated mocks for feeds tests
    '^@/lib/auth$': '<rootDir>/__mocks__/auth.js',
    '^@/lib/stores/feedsStore$': '<rootDir>/__mocks__/feedsStore.js',
    '^@/features/hashtags/hooks/useHashtags$': '<rootDir>/__mocks__/useHashtags.js',
    // Handle CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// Export in CommonJS format for Jest projects compatibility
module.exports = createJestConfig(customJestConfig);