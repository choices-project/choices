/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/jest.client.config.js',
    '<rootDir>/jest.server.config.js'
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
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