/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.after.js', '<rootDir>/tests/setup.ts'],
      testMatch: [
        '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/*.spec.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/utils/supabase/server$': '<rootDir>/utils/supabase/server',
        '^@/shared/(.*)$': '<rootDir>/shared/$1',
        '^@/features/(.*)$': '<rootDir>/features/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/app/api/health/civics/route$': '<rootDir>/tests/__mocks__/api-route.js',
        '^@/app/api/v1/civics/address-lookup/route$': '<rootDir>/tests/__mocks__/api-route.js',
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
        ".*/archive/.*",
        "/app/api/.*"
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
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.after.js', '<rootDir>/tests/setup.ts'],
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/tests/unit/**/*.spec.{js,jsx,ts,tsx}',
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
        ".*/archive/.*",
        "<rootDir>/tests/e2e/" // ← keep Playwright out of Jest
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