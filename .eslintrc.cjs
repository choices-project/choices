/* eslint-env node */
module.exports = {
  root: true,
  // Modern ESLint configuration optimized for Zustand + Next.js 14
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:eslint-comments/recommended',
  ],
  ignorePatterns: [
    'archive/**',
    'archive-*/**',
    'app/archive-*/**',
    '_reports/**',
    'tests/e2e/archive-old/**',
    'archive-unused-files/**',
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    '**/*.d.ts',
    '.eslintcache*',
  ],
  plugins: [
    '@typescript-eslint', 
    'unused-imports', 
    'boundaries',
    'import'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.ci.json', './tsconfig.tests.json'],
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
    node: true,
    jest: true,
    es2022: true,
  },
  settings: {
    'boundaries/elements': [
      { type: 'app',        pattern: 'app/**' },
      { type: 'features',   pattern: 'features/**' },
      { type: 'components', pattern: 'components/**' },
      { type: 'lib',        pattern: 'lib/**' },
      { type: 'utils',      pattern: 'utils/**' },
      { type: 'stores',     pattern: 'lib/stores/**' },
      { type: 'tests',      pattern: 'tests/**' },
    ],
    'import/core-modules': ['k6', 'k6/http'],
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './tsconfig.ci.json', './tsconfig.tests.json'],
      },
    },
  },
  rules: {
    // === CORE TYPESCRIPT RULES ===
    '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports
    '@typescript-eslint/no-explicit-any': 'warn', // Allow but warn
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-confusing-void-expression': ['error', { 'ignoreArrowShorthand': true }],
    '@typescript-eslint/consistent-type-imports': ['error', { 
      fixStyle: 'inline-type-imports',
      prefer: 'type-imports',
      disallowTypeAnnotations: false
    }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for Zustand
    '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict for Zustand stores

    // === UNUSED IMPORTS (Modern approach) ===
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        destructuredArrayIgnorePattern: '^_',
      },
    ],

    // === ZUSTAND-OPTIMIZED BOUNDARIES ===
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        // Stores can be imported by features, components, app, and other stores
        { from: 'stores', allow: ['stores', 'lib', 'utils', 'features', 'components', 'app'] },
        // Lib can import from stores, utils, and other lib modules
        { from: 'lib', allow: ['lib', 'stores', 'utils', 'features', 'components'] },
        // Features can import from stores, lib, components, utils, and app
        { from: 'features', allow: ['stores', 'lib', 'components', 'utils', 'features', 'app'] },
        // Components can import from stores, lib, utils, and other components
        { from: 'components', allow: ['stores', 'lib', 'utils', 'components', 'features'] },
        // App can import from stores, features, components, lib, utils
        { from: 'app', allow: ['stores', 'features', 'components', 'lib', 'utils'] },
        // Utils can only import from lib and stores
        { from: 'utils', allow: ['lib', 'stores'] },
        // Tests can import everything
        { from: 'tests', allow: ['stores', 'app', 'features', 'components', 'lib', 'utils'] },
      ],
    }],

    // === IMPORT RESTRICTIONS (Updated for Zustand) ===
    'no-restricted-imports': ['error', {
      patterns: [
        // Legacy paths - use Zustand stores instead
        { group: ['@/shared/lib/*', '@/shared/admin/*', '@/admin/lib/*'], message: 'Use "@/lib/stores/**" for state management.' },
        { group: ['@/components/polls/*'], message: "Use '@/features/polls/*' (canonical)." },
        { group: ['@/components/voting/*'], message: "Use '@/features/voting/*' (canonical)." },
        { group: ['@/components/CreatePoll*'], message: "Use '@/features/polls/components/CreatePollForm' (canonical)." },
        { group: ['@/components/admin/layout/*'], message: "Use '@/app/(app)/admin/layout/*' (canonical)." },
        { group: ['@/components/auth/*'], message: "Use '@/features/auth/*' (canonical)." },
        { group: ['@/components/civics/*'], message: "Use '@/features/civics/*' (canonical)." },
        { group: ['@/components/onboarding/*'], message: "Use '@/features/onboarding/*' (canonical)." },
        { group: ['@/components/pwa/*'], message: "Use '@/features/pwa/*' (canonical)." },
        { group: ['@/components/lazy/*'], message: "Use '@/features/admin/*' (canonical)." },
        // Prevent direct Zustand imports - use centralized stores
        { group: ['zustand'], message: 'Use "@/lib/stores" for centralized state management.' },
        { group: ['zustand/middleware'], message: 'Use "@/lib/stores" for centralized state management.' },
        { group: ['zustand/middleware/*'], message: 'Use "@/lib/stores" for centralized state management.' },
      ],
    }],

    // === REACT/JSX RULES (RSC-optimized) ===
    'react/jsx-no-undef': ['error', { allowGlobals: false }],
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

    // === IMPORT RULES (Enhanced) ===
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/no-restricted-paths': ['error', {
      zones: [
        { 
          target: './components', 
          from: 'lucide-react',
          message: 'Import icons via direct modular import, never re-export through UI barrel.' 
        },
        {
          target: './app',
          from: './components/ui/client',
          message: 'Server components cannot import client barrel. Use @/components/ui for server-safe primitives.'
        },
        // Prevent direct store imports from outside lib/stores
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
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      },
      pathGroups: [
        {
          pattern: 'react',
          group: 'external',
          position: 'before'
        },
        {
          pattern: 'next/**',
          group: 'external',
          position: 'before'
        },
        {
          pattern: '@/**',
          group: 'internal',
          position: 'before'
        },
        {
          pattern: '@/lib/stores/**',
          group: 'internal',
          position: 'before'
        }
      ],
      pathGroupsExcludedImportTypes: ['react', 'next']
    }],

    // === ZUSTAND-SPECIFIC RULES ===
    'no-restricted-syntax': [
      'error',
      // Prevent direct useState for global state
      { 
        selector: 'CallExpression[callee.name="useState"]',
        message: 'Consider using Zustand stores for global state management instead of useState.',
        filter: {
          // Only flag useState in components that could benefit from global state
          kind: 'const',
          declarations: [{
            type: 'VariableDeclarator',
            id: { type: 'ArrayPattern' }
          }]
        }
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
      }
    ],

    // === PERFORMANCE RULES ===
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-confirm': 'error',
    'no-prompt': 'error',

    // === SECURITY RULES ===
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
  overrides: [
    // === TEST FILES ===
    {
      files: ['**/*.test.*', '**/tests/**/*', '**/__tests__/**/*'],
      rules: {
        'unused-imports/no-unused-imports': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-restricted-syntax': 'off', // Allow any syntax in tests
      },
    },
    // === STORE FILES (Zustand-specific) ===
    {
      files: ['**/lib/stores/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Zustand uses any internally
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
    // === UI COMPONENTS ===
    {
      files: ['components/**', 'app/**'],
      rules: {
        'no-restricted-syntax': [
          'warn',
          { 
            selector: 'TSTypeReference[typeName.name="AnyObject"]', 
            message: 'Prefer exact interfaces over AnyObject.' 
          },
          { 
            selector: 'AssignmentExpression[right.type="Identifier"][right.name="undefined"]',
            message: 'Use conditional spread or delete, not = undefined.' 
          },
        ],
      },
    },
    // === CONFIG FILES ===
    {
      files: ['**/webpack.config*.js', '**/next.config*.js', '**/*.config.js', '**/*.config.cjs'],
      rules: {
        'import/no-unresolved': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // === JAVASCRIPT FILES ===
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    // === API ROUTES ===
    {
      files: ['**/api/**/*.ts', '**/route.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn', // API routes may need any for request/response
        'no-console': 'off', // API routes need logging
      },
    },
  ],
};
