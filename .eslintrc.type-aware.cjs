/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    './.eslintrc.cjs', // Inherit base config
  ],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.ci.json', './tsconfig.tests.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    // === STRICT TYPE-AWARE RULES ===
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-confusing-void-expression': ['error', { 'ignoreArrowShorthand': true }],
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/restrict-string-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-implied-eval': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-unnecessary-type-constraint': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/consistent-type-imports': ['error', { 
      fixStyle: 'inline-type-imports',
      prefer: 'type-imports',
      disallowTypeAnnotations: false
    }],

    // === ZUSTAND-SPECIFIC TYPE RULES ===
    '@typescript-eslint/no-explicit-any': 'warn', // Allow in Zustand stores
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for Zustand
    '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict for Zustand stores

    // === ENHANCED IMPORT RULES ===
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/no-restricted-paths': ['error', {
      zones: [
        // Prevent direct Zustand imports
        {
          target: './features',
          from: './lib/stores',
          except: ['./lib/stores/index.ts'],
          message: 'Import stores from "@/lib/stores" (centralized exports).'
        },
        {
          target: './components',
          from: './lib/stores',
          except: ['./lib/stores/index.ts'],
          message: 'Import stores from "@/lib/stores" (centralized exports).'
        },
        {
          target: './app',
          from: './lib/stores',
          except: ['./lib/stores/index.ts'],
          message: 'Import stores from "@/lib/stores" (centralized exports).'
        }
      ]
    }],

    // === ZUSTAND-SPECIFIC SYNTAX RULES ===
    'no-restricted-syntax': [
      'error',
      // Prevent direct useState for global state
      { 
        selector: 'CallExpression[callee.name="useState"]',
        message: 'Consider using Zustand stores for global state management instead of useState.',
      },
      // Prevent direct localStorage usage
      { 
        selector: 'CallExpression[callee.object.name="localStorage"]',
        message: 'Use Zustand persist middleware for state persistence instead of direct localStorage.',
      },
      // Prevent direct sessionStorage usage
      { 
        selector: 'CallExpression[callee.object.name="sessionStorage"]',
        message: 'Use Zustand persist middleware for state persistence instead of direct sessionStorage.',
      },
      // Enforce proper error handling in stores
      { 
        selector: 'CallExpression[callee.property.name="setError"]',
        message: 'Ensure error handling in Zustand stores includes proper error types and user feedback.',
      },
      // Prevent direct Zustand imports
      { 
        selector: 'ImportDeclaration[source.value="zustand"]',
        message: 'Use "@/lib/stores" for centralized state management instead of direct Zustand imports.',
      },
      { 
        selector: 'ImportDeclaration[source.value="zustand/middleware"]',
        message: 'Use "@/lib/stores" for centralized state management instead of direct Zustand imports.',
      },
      { 
        selector: 'ImportDeclaration[source.value="zustand/middleware/immer"]',
        message: 'Use "@/lib/stores" for centralized state management instead of direct Zustand imports.',
      },
      { 
        selector: 'ImportDeclaration[source.value="zustand/middleware/persist"]',
        message: 'Use "@/lib/stores" for centralized state management instead of direct Zustand imports.',
      }
    ],
  },
  overrides: [
    // === STORE FILES (Zustand-specific) ===
    {
      files: ['**/lib/stores/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Zustand uses any internally
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        'no-restricted-syntax': [
          'error',
          // Enforce proper store structure
          { 
            selector: 'ExportDefaultDeclaration > FunctionDeclaration',
            message: 'Stores should export named functions, not default exports.'
          }
        ],
      },
    },
    // === TEST FILES ===
    {
      files: ['**/*.test.*', '**/tests/**/*', '**/__tests__/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        'no-restricted-syntax': 'off', // Allow any syntax in tests
      },
    },
    // === API ROUTES ===
    {
      files: ['**/api/**/*.ts', '**/route.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn', // API routes may need any for request/response
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        'no-console': 'off', // API routes need logging
      },
    },
    // === CONFIG FILES ===
    {
      files: ['**/*.config.js', '**/*.config.cjs', '**/webpack.config*.js', '**/next.config*.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
};
