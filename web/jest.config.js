/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/*.spec.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/*.spec.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/utils/supabase/server$': '<rootDir>/utils/supabase/server',
        '^@/shared/(.*)$': '<rootDir>/shared/$1',
        '^@/features/(.*)$': '<rootDir>/features/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      testPathIgnorePatterns: [
        "/node_modules/",
        "/\\.next/",
        "/out/",
        "/build/",
        "/dist/",
        ".*\\.disabled",
        ".*\\.disabled\\..*",
        ".*/tests\\.disabled/.*",
        ".*/scripts\\.disabled/.*",
        ".*/archive/.*"
      ],
      collectCoverageFrom: [
        'components/**/*.{js,jsx,ts,tsx}',
        'app/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/*.disabled',
        '!**/*.disabled.*',
        '!**/tests.disabled/**',
        '!**/scripts.disabled/**',
        '!**/archive/**'
      ],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/tests/**/*.spec.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/lib/**/*.spec.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/utils/supabase/server$': '<rootDir>/utils/supabase/server',
        '^@/shared/(.*)$': '<rootDir>/shared/$1',
        '^@/features/(.*)$': '<rootDir>/features/$1',
      },
      testPathIgnorePatterns: [
        "/node_modules/",
        "/\\.next/",
        "/out/",
        "/build/",
        "/dist/",
        ".*\\.disabled",
        ".*\\.disabled\\..*",
        ".*/tests\\.disabled/.*",
        ".*/scripts\\.disabled/.*",
        ".*/archive/.*"
      ],
      collectCoverageFrom: [
        'lib/**/*.{js,jsx,ts,tsx}',
        'utils/**/*.{js,jsx,ts,tsx}',
        'shared/**/*.{js,jsx,ts,tsx}',
        'features/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/*.disabled',
        '!**/*.disabled.*',
        '!**/tests.disabled/**',
        '!**/scripts.disabled/**',
        '!**/archive/**'
      ],
    }
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    }
  }
};