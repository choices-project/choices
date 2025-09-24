/* eslint-env node */
module.exports = {
  root: false, // overlay
  extends: [
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json', // narrow project just for lint
  },
  overrides: [
    // Core/critical code: strict
    {
      files: ['lib/**/*', 'shared/**/*', 'app/api/**/*'],
      ignoredByDefault: false,
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-unnecessary-condition': 'error',
        '@typescript-eslint/no-confusing-void-expression': ['error', { 'ignoreArrowShorthand': true }],
        '@typescript-eslint/restrict-template-expressions': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
      }
    },
    // Components & pages: pragmatic
    {
      files: ['app/(app)/**/*', 'components/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-misused-promises': 'warn',
        '@typescript-eslint/no-unnecessary-condition': 'warn',
        '@typescript-eslint/no-confusing-void-expression': ['warn', { 'ignoreArrowShorthand': true }],
        '@typescript-eslint/restrict-template-expressions': 'warn',
        '@typescript-eslint/restrict-plus-operands': 'warn',
      }
    },
    // Tests & scripts: practical defaults
    {
      files: ['tests/**/*', 'scripts/**/*'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
      }
    },
    // Archive/disabled: don't block CI
    {
      files: ['archive/**/*', 'archive-*/**/*', 'app/archive-*/**/*', '_reports/**/*', 'tests/e2e/archive-old/**/*', 'archive-unused-files/**/*', 'web/disabled-pages/**/*', '**/*.disabled'],
      rules: { 
        'no-unused-vars': 'off', 
        '@typescript-eslint/*': 'off' 
      }
    },
    // Global type-aware rules for all files
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/array-type': 'warn',
      },
    },
  ],
};
