/** @type {import('jest').Config} */
module.exports = {
  displayName: 'client',
  rootDir: '.',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(t|j)sx?$': ['babel-jest'] },

  // 🔧 add these:
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Optional niceties:
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^server-only$': '<rootDir>/tests/mocks/server-only.js',
    '^client-only$': '<rootDir>/tests/mocks/client-only.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  // glob needs to be micromatch-friendly:
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
};
