/* eslint-env node */
module.exports = {
  root: true,
  // Works with ESLint v8 + Next 14
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
  ],
  plugins: ['@typescript-eslint', 'unused-imports', 'boundaries'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // NOTE: No "project" here for speed. Type-aware rules live in the strict overlay.
  },
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  settings: {
    'boundaries/elements': [
      { type: 'app',        pattern: 'app/**' },
      { type: 'features',   pattern: 'features/**' },
      { type: 'components', pattern: 'components/**' },
      { type: 'lib',        pattern: 'lib/**' },
      { type: 'utils',      pattern: 'utils/**' },
      { type: 'tests',      pattern: 'tests/**' },
    ],
  },
  rules: {
    // Prefer the dedicated plugin for unuseds (fewer false positives with TS)
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    // Architectural boundaries (adjust if you need to)
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'lib',        allow: ['lib', 'utils', 'features'] }, // Allow lib to import from utils and features
        { from: 'features',   allow: ['lib', 'components', 'utils'] },
        { from: 'components', allow: ['lib', 'utils'] },
        { from: 'app',        allow: ['features', 'components', 'lib', 'utils'] },
        { from: 'utils',      allow: ['lib'] },
        { from: 'tests',      allow: ['app', 'features', 'components', 'lib', 'utils'] },
      ],
    }],

    // Block legacy paths forever
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/shared/*', '@/admin/lib/*'], message: 'Use "@/lib/**" or feature modules.' },
      ],
    }],
  },
  overrides: [
    // Test files: loosen some rules
    {
      files: ['**/*.test.*', '**/tests/**/*'],
      rules: {
        'unused-imports/no-unused-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    '**/*.d.ts',
  ],
};


