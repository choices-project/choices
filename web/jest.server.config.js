/** @type {import('jest').Config} */
module.exports = {
  displayName: 'server',
  rootDir: '.',
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)sx?$': ['babel-jest'] },

  // 🔧 add these:
  moduleNameMapper: {
    '^@/lib/logger$': '<rootDir>/tests/mocks/logger.ts',
    '^@/lib/auth-middleware$': '<rootDir>/tests/mocks/auth-middleware.ts',
    '^@/(.*)$': '<rootDir>/$1',
    '^server-only$': '<rootDir>/tests/mocks/server-only.js',
    '^client-only$': '<rootDir>/tests/mocks/client-only.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  testMatch: ['<rootDir>/tests/server/**/*.test.ts?(x)'],
};
