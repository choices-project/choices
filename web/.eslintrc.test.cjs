/* eslint-env node */
/**
 * ESLint Configuration for Test Files
 * 
 * This configuration is specifically for test files and JavaScript files
 * in test directories. It uses basic ESLint without TypeScript rules
 * to avoid parsing errors.
 * 
 * Created: January 27, 2025
 * Status: Production-ready for test file linting
 */

module.exports = {
  root: true,
  
  // Basic ESLint setup for test files
  extends: [
    'eslint:recommended',
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    '**/*.d.ts',
  ],
  
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
  },
  
  rules: {
    // Basic code quality rules - lenient for test files
    'no-console': 'off',
    'no-unused-vars': 'off',
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'no-var': 'off',
    'prefer-const': 'off',
    'prefer-arrow-callback': 'off',
    'arrow-spacing': 'off',
    'object-shorthand': 'off',
    'prefer-template': 'off',
  },
};


