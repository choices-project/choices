#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Running Unit Tests...\n');

// Check if Jest is available
try {
  require.resolve('jest');
} catch (e) {
  console.error('❌ Jest is not installed. Please install it first:');
  console.error('   npm install --save-dev jest @testing-library/react @testing-library/jest-dom');
  process.exit(1);
}

// Create a simple Jest config for unit tests
const jestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ]
    }]
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'json', 'html'],
  verbose: true
};

// Write Jest config to a temporary file
const configPath = path.join(__dirname, '../jest.config.unit.js');
fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)}`);

try {
  // Run Jest with the unit test config
  execSync(`npx jest --config ${configPath}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Unit tests completed successfully!');
  
  // Clean up config file
  fs.unlinkSync(configPath);
  
} catch (error) {
  console.error('\n❌ Unit tests failed!');
  
  // Clean up config file
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  process.exit(1);
}
