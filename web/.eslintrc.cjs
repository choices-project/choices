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
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
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

    // RSC-safe import rules
    'react/jsx-no-undef': ['error', { allowGlobals: false }],
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
        }
      ]
    }],

    // Regression-blocking rules for type safety (moved to type-aware overlay)
    '@typescript-eslint/no-explicit-any': 'off', // moved to type-aware overlay
    '@typescript-eslint/consistent-type-imports': ['error', { 
      fixStyle: 'inline-type-imports',
      prefer: 'type-imports'
    }],
    
    // Phase 4: exactOptionalPropertyTypes enforcement (moved to type-aware overlay)
    // '@typescript-eslint/no-unnecessary-condition': 'error', // requires type info
    // '@typescript-eslint/no-confusing-void-expression': ['error', { 'ignoreArrowShorthand': true }], // requires type info
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    'no-restricted-syntax': [
      'warn', // Temporarily downgrade to warning for deployment
      { 
        selector: 'TSTypeReference[typeName.name="AnyObject"]', 
        message: 'Prefer exact interfaces over AnyObject.' 
      },
      { 
        selector: 'AssignmentExpression[right.type="Identifier"][right.name="undefined"]',
        message: 'Use conditional spread or delete, not = undefined.' 
      },
      { 
        selector: 'SpreadElement[argument.type="Identifier"]', 
        message: 'Prefer withOptional()/stripUndefinedDeep on objects that may contain undefined.' 
      }
    ],
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


