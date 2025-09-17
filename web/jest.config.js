/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  globals: {
    "ts-jest": { 
      tsconfig: "../tsconfig.tests.json", 
      isolatedModules: true 
    }
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts'
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