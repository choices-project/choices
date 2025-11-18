/** @type {import('jest').Config} */
module.exports = {
  // Global timeout settings
  testTimeout: 30000, // 30 seconds per test
  slowTestThreshold: 10, // Mark tests as slow if they take more than 10 seconds
  
  // Use separate Babel config for Jest (allows Next.js to use SWC)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },

  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testTimeout: 20000, // 20 seconds for client tests
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.after.js',
        '<rootDir>/tests/setup.ts'
      ],
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
      testEnvironment: 'jsdom',
      testTimeout: 25000, // 25 seconds for server tests
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.after.js',
        '<rootDir>/tests/setup.ts'
      ],
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/tests/unit/**/*.spec.{js,jsx,ts,tsx}',
        '<rootDir>/tests/api/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/tests/api/**/*.spec.{js,jsx,ts,tsx}',
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
    ,
    {
      displayName: 'contracts',
      testEnvironment: 'node',
      testTimeout: 20000,
      setupFiles: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/tests/contracts/**/*.test.{ts,tsx,js,jsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testPathIgnorePatterns: [
        '/node_modules/',
        '/\\.next/',
        '/out/',
        '/build/',
        '/dist/',
      ],
    }
  ],
  // Coverage configuration (metrics only; thresholds are tracked via dashboards, not hard-gated in Jest)
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverage: false, // Enable only when running test:coverage / test:coverage:ci
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/build/',
    '\\.d\\.ts$',
    '\\.disabled',
    '\\.disabled\\.',
    '/tests\\.disabled/',
    '/scripts\\.disabled/',
    '/archive/'
  ]
};
