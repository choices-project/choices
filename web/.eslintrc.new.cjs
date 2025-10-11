/* eslint-env node */
/**
 * Modern ESLint Configuration for Choices Platform
 * 
 * This configuration replaces the legacy setup with a clean, modern approach:
 * - Simplified path mapping aligned with TypeScript
 * - Removed legacy "canonical" path restrictions
 * - Unified configuration (no more dual configs)
 * - Better performance and maintainability
 * 
 * Created: January 21, 2025
 * Status: Proposed replacement for .eslintrc.cjs
 */

module.exports = {
  root: true,
  
  // Modern ESLint setup for Next.js 14 + TypeScript
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:eslint-comments/recommended',
  ],
  
  // Ignore patterns - simplified and focused
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    '**/*.d.ts',
    // Archive patterns
    'archive/**',
    'archive-*/**',
    'app/archive-*/**',
    '_reports/**',
    'tests/e2e/archive-old/**',
    'archive-unused-files/**',
    // Disabled files
    '**/*.disabled',
    '**/*.disabled.*',
    '**/scripts.disabled/**',
    '**/tests.disabled/**',
  ],
  
  plugins: [
    '@typescript-eslint',
    'unused-imports',
    'boundaries',
  ],
  
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  
  settings: {
    // Simplified boundaries - focus on core architecture
    'boundaries/elements': [
      { type: 'app', pattern: 'app/**' },
      { type: 'features', pattern: 'features/**' },
      { type: 'components', pattern: 'components/**' },
      { type: 'lib', pattern: 'lib/**' },
      { type: 'utils', pattern: 'utils/**' },
      { type: 'tests', pattern: 'tests/**' },
    ],
    'import/core-modules': ['k6', 'k6/http'],
  },
  
  rules: {
    // ============================================================================
    // CORE RULES - Essential for code quality
    // ============================================================================
    
    // Unused imports/variables - use dedicated plugin for better TS support
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    
    // Type imports - enforce consistent type imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        fixStyle: 'inline-type-imports',
        prefer: 'type-imports',
      },
    ],
    
    // Type definitions - prefer interfaces over types for consistency
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    
    // ============================================================================
    // ARCHITECTURE RULES - Enforce clean architecture
    // ============================================================================
    
    // Boundaries - enforce proper module boundaries
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'lib', allow: ['lib', 'utils', 'features', 'components'] },
          { from: 'features', allow: ['lib', 'components', 'utils', 'features', 'app'] },
          { from: 'components', allow: ['lib', 'utils', 'components', 'features'] },
          { from: 'app', allow: ['features', 'components', 'lib', 'utils'] },
          { from: 'utils', allow: ['lib', 'utils', 'features'] },
          { from: 'tests', allow: ['app', 'features', 'components', 'lib', 'utils'] },
        ],
      },
    ],
    
    // Import restrictions - simplified and focused
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // Block direct imports from node_modules in components (use barrel exports)
          {
            group: ['lucide-react'],
            importNames: ['*'],
            message: 'Import icons via @/components/ui/icons barrel export for better tree-shaking.',
          },
          // Block server-only imports in client components
          {
            group: ['server-only'],
            message: 'Server-only modules cannot be imported in client components.',
          },
        ],
      },
    ],
    
    // ============================================================================
    // REACT/JSX RULES - Next.js and React best practices
    // ============================================================================
    
    // React hooks - enforce proper dependency arrays
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // JSX rules
    'react/jsx-no-undef': ['error', { allowGlobals: false }],
    'react/jsx-uses-react': 'off', // Not needed with new JSX transform
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    
    // ============================================================================
    // IMPORT RULES - Modern import management
    // ============================================================================
    
    // Import resolution
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    
    // ============================================================================
    // TYPESCRIPT RULES - Type safety and best practices
    // ============================================================================
    
    // Type safety rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    
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
  
  // ============================================================================
  // OVERRIDES - File-specific rule adjustments
  // ============================================================================
  
  overrides: [
    // Test files - more lenient rules
    {
      files: ['**/*.test.*', '**/*.spec.*', '**/tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': 'off',
        'no-console': 'off',
      },
    },
    
    // Configuration files - allow require() and other Node.js patterns
    {
      files: ['**/*.config.*', '**/*.config.*', '**/next.config.*', '**/tailwind.config.*'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    
    // Archive and disabled files - minimal rules
    {
      files: [
        'archive/**/*',
        'archive-*/**/*',
        'app/archive-*/**/*',
        '_reports/**/*',
        'tests/e2e/archive-old/**/*',
        'archive-unused-files/**/*',
        '**/*.disabled',
        '**/*.disabled.*',
        '**/scripts.disabled/**/*',
        '**/tests.disabled/**/*',
      ],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/*': 'off',
        'unused-imports/*': 'off',
        'import/*': 'off',
        'boundaries/*': 'off',
      },
    },
    
    // API routes - server-specific rules
    {
      files: ['app/api/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error', // Stricter for API routes
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
      },
    },
    
    // Client components - React-specific rules
    {
      files: ['**/*.tsx'],
      rules: {
        'react/jsx-key': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/no-array-index-key': 'warn',
        'react/no-unescaped-entities': 'warn',
      },
    },
  ],
};
