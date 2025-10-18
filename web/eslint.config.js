/**
 * Modern ESLint Configuration for Choices Platform
 * 
 * ESLint 9 flat config format for Next.js 15.5.6 + React 19 + TypeScript 5.9
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025 - Optimized for latest versions
 * Status: Production-ready ESLint 9 configuration
 */

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';
import boundaries from 'eslint-plugin-boundaries';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  // Base configuration
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: [
      'node_modules/',
      '.next/',
      'dist/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '**/*.d.ts',
      'archive/**',
      'archive-*/**',
      'app/archive-*/**',
      '_reports/**',
      'tests/e2e/archive-old/**',
      'archive-unused-files/**',
      '**/*.disabled',
      '**/*.disabled.*',
      '**/scripts.disabled/**',
      '**/tests.disabled/**',
      '**/tests/**/*.js',
      '**/test/**/*.js',
      '**/__mocks__/**/*.js',
      '**/fixtures/**/*.js',
      '**/helpers/**/*.js',
      '**/clean/**/*.js',
      '**/jest/**/*.js',
      '**/unit/**/*.js',
      '**/integration/**/*.js',
      '**/e2e/**/*.js',
      '**/playwright/**/*.js',
      '**/performance/**/*.js',
      '**/error-prevention/**/*.js',
      '**/eslint/**/*.js',
      '**/*.config.js',
      '**/*.config.ts',
      '**/next.config.js',
      '**/tailwind.config.js',
      '**/postcss.config.js',
      '**/jest.config.js',
      '**/playwright*.config.ts',
      '**/middleware.ts',
      '**/temp-*.ts',
      '**/temp-*.js',
    ],
  },

  // Main configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        // Additional globals for Next.js
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'unused-imports': unusedImports,
      'boundaries': boundaries,
      '@next/next': nextPlugin,
    },
    rules: {
      // ============================================================================
      // CORE RULES - Essential for code quality
      // ============================================================================
      
      // Unused imports/variables
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      
      // Type imports - optimized for TypeScript 5.9
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      
      // Type definitions
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      
      // ============================================================================
      // TYPESCRIPT RULES - Type safety and best practices for TypeScript 5.9
      // ============================================================================
      
      // Type safety rules - stricter for TypeScript 5.9
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      
      // Modern TypeScript 5.9 features
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/triple-slash-reference': 'error',
      
      // Array and object rules
      '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      
      // ============================================================================
      // CODE QUALITY RULES - General code quality
      // ============================================================================
      
      // General code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'warn',
      
      // ============================================================================
      // PERFORMANCE RULES - Performance optimizations
      // ============================================================================
      
      // Restrict problematic patterns
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'AssignmentExpression[right.type="Identifier"][right.name="undefined"]',
          message: 'Use conditional spread or delete, not = undefined.',
        },
        {
          selector: 'ObjectExpression > SpreadElement[argument.type="Identifier"]',
          message: 'Prefer withOptional()/stripUndefinedDeep on objects that may contain undefined.',
        },
      ],
    },
  },

  // Next.js specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Test files - lenient rules
  {
    files: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/tests/**/*',
      '**/test/**/*',
      '**/__tests__/**/*',
      '**/__mocks__/**/*',
      '**/fixtures/**/*',
      '**/helpers/**/*',
      '**/clean/**/*',
      '**/jest/**/*',
      '**/unit/**/*',
      '**/integration/**/*',
      '**/e2e/**/*',
      '**/playwright/**/*',
      '**/performance/**/*',
      '**/error-prevention/**/*',
      '**/eslint/**/*',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-template': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // JavaScript files in test directories
  {
    files: [
      '**/tests/**/*.js',
      '**/test/**/*.js',
      '**/__tests__/**/*.js',
      '**/__mocks__/**/*.js',
      '**/fixtures/**/*.js',
      '**/helpers/**/*.js',
      '**/clean/**/*.js',
      '**/jest/**/*.js',
      '**/unit/**/*.js',
      '**/integration/**/*.js',
      '**/e2e/**/*.js',
      '**/playwright/**/*.js',
      '**/performance/**/*.js',
      '**/error-prevention/**/*.js',
      '**/eslint/**/*.js',
    ],
    languageOptions: {
      parser: js.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'object-shorthand': 'off',
      'arrow-spacing': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];
