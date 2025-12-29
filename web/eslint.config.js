import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import eslintComments from 'eslint-plugin-eslint-comments';
import formatjs from 'eslint-plugin-formatjs';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

const hasLegacyCopy = false;

// Single source of truth for import ordering to keep CI/local in sync
const importOrderRule = [
  'error',
  {
    groups: [
      'builtin',
      'external',
      'internal',
      ['parent', 'sibling', 'index'],
      'object',
      'type',
    ],
    pathGroups: [
      {
        pattern: '@choices/**',
        group: 'internal',
        position: 'before',
      },
      {
        pattern: '@/app/**',
        group: 'internal',
      },
      {
        pattern: '@/features/**',
        group: 'internal',
        position: 'after',
      },
      {
        pattern: '@/components/**',
        group: 'internal',
        position: 'after',
      },
      {
        pattern: '@/lib/**',
        group: 'internal',
        position: 'after',
      },
      {
        pattern: '@/hooks/**',
        group: 'internal',
        position: 'after',
      },
    ],
    pathGroupsExcludedImportTypes: ['builtin'],
    alphabetize: {
      order: 'asc',
      caseInsensitive: true,
    },
    'newlines-between': 'always',
  },
];

export default [
  // Global environment
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // i18n safeguards
  {
    files: [
      'app/(app)/layout.tsx',
      'app/providers.tsx',
      'app/auth/page.tsx',
      'app/(app)/candidates/**/*.{ts,tsx}',
      'components/shared/**/*.{ts,tsx}',
      'features/onboarding/**/*.{ts,tsx}',
      'features/civics/**/*.{ts,tsx}',
      'features/contact/**/*.{ts,tsx}',
      'features/polls/**/*.{ts,tsx}',
      'features/feeds/**/*.{ts,tsx}',
    ],
    plugins: {
      formatjs,
    },
    rules: hasLegacyCopy
      ? {
          'formatjs/no-literal-string-in-jsx': 'warn',
        }
      : {
          'formatjs/no-literal-string-in-jsx': 'error',
    },
  },
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript configuration (non-type-aware)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // NOTE: No "project" here for speed. Type-aware rules use separate config below.
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
      'boundaries': boundaries,
      import: importPlugin,
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
      'import/core-modules': ['k6', 'k6/http'],
    },
    rules: {
      // TypeScript handles undefined variables better than ESLint
      'no-undef': 'off',
      // TypeScript specific rules
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
      '@typescript-eslint/no-explicit-any': 'off', // Handled in type-aware config below
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'import/order': importOrderRule,
      'formatjs/no-literal-string-in-jsx': 'off',

      // Console logging - enforce use of logger
      'no-console': ['error', { allow: ['warn', 'error'] }],

       // Boundaries plugin - architectural rules (relaxed for existing codebase)
       'boundaries/element-types': ['warn', {
         default: 'disallow',
         rules: [
           { from: 'lib',        allow: ['lib', 'utils', 'features', 'components'] },
           { from: 'features',   allow: ['lib', 'components', 'utils', 'features', 'app'] },
           { from: 'components', allow: ['lib', 'utils', 'components', 'features', 'tests'] },
           { from: 'app',        allow: ['features', 'components', 'lib', 'utils'] },
           { from: 'utils',      allow: ['lib', 'utils', 'features'] },
           { from: 'tests',      allow: ['app', 'features', 'components', 'lib', 'utils'] },
         ],
       }],

      // Block legacy paths
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/shared/lib/*', '@/shared/admin/*', '@/admin/lib/*'], message: 'Use "@/lib/**" or feature modules.' },
          { group: ['@/components/polls/*'], message: "Use '@/features/polls/*' (canonical)." },
          { group: ['@/components/voting/*'], message: "Use '@/features/voting/*' (canonical)." },
          { group: ['@/components/CreatePoll*'], message: "Use '@/features/polls/components/CreatePollForm' (canonical)." },
          { group: ['@/components/admin/layout/*'], message: "Use '@/app/(app)/admin/layout/*' (canonical)." },
          { group: ['@/lib/util/objects', '@/lib/util/objects.*'], message: 'withOptional is deprecated. Use explicit builders/conditional spreads.' },
          // Prevent reintroduction of removed/legacy HTTP/CORS/CSRF utilities
          // Note: @/lib/http/origin is the canonical path and should NOT be restricted
          { group: ['@/lib/utils/http', '@/lib/utils/http.*'], message: 'Use "@/lib/http/origin" (canonical).' },
          { group: ['@/lib/utils/cors', '@/lib/utils/cors.*'], message: 'Use CORS helpers in "@/lib/api/response-utils".' },
          { group: ['@/lib/utils/csrf', '@/lib/utils/csrf.*', '@/lib/utils/csrf-fetch', '@/lib/utils/csrf-fetch.*'], message: 'CSRF utilities were removed; use standard Next.js patterns and auth middleware.' },
          // Prevent using duplicate trending implementation
          { group: ['@/features/feeds/lib/TrendingHashtags', '@/features/feeds/lib/TrendingHashtags.*'], message: 'Use "@/lib/trending/TrendingHashtags" (canonical).' },
        ],
      }],

      // Restricted syntax (exactOptionalPropertyTypes enforcement)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypeReference[typeName.name="AnyObject"]',
          message: 'Prefer exact interfaces over AnyObject.'
        },
        {
          selector: 'AssignmentExpression[right.type="Identifier"][right.name="undefined"]',
          message: 'Use conditional spread or delete, not = undefined.'
        }
      ],
    },
  },

  // React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'eslint-comments': eslintComments,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
          baseUrl: '.',
          paths: {
            '@/*': ['./*'],
            '@/lib/*': ['./lib/*'],
            '@/hooks/*': ['./hooks/*', './features/*/hooks/*'],
            '@/components/*': ['./components/*', './features/*/components/*'],
            '@/features/*': ['./features/*'],
            '@/utils/*': ['./utils/*'],
            '@/shared/*': ['./shared/*'],
            '@/types/*': ['./types/*'],
            '@/lib/security/*': ['./lib/core/security/*', './lib/utils/*'],
            '@/lib/cache/*': ['./lib/*'],
          },
        },
      },
    },
    rules: {
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-sort-props': 'off',
      'react/jsx-wrap-multilines': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX A11y rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // ESLint comments
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/no-unused-enable': 'error',
      'eslint-comments/disable-enable-pair': 'error',
    },
  },

  // Import plugin configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // RSC-safe import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'warn',
      'import/no-internal-modules': 'off',
      'import/no-relative-packages': 'warn',
      'import/no-relative-parent-imports': 'off',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/exports-last': 'off',
      'import/no-namespace': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/order': [
        ...importOrderRule,
      ],
      'import/newline-after-import': 'error',
      'import/prefer-default-export': 'off',
      'import/no-default-export': 'off',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-deprecated': 'warn',
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
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.*',
            '**/*.spec.*',
            '**/test/**',
            '**/tests/**',
            '**/__tests__/**',
            '**/jest.config.*',
            '**/playwright.config.*',
            '**/vite.config.*',
            '**/webpack.config.*',
            '**/rollup.config.*',
            '**/eslint.config.*',
            '**/tailwind.config.*',
            '**/postcss.config.*',
            '**/next.config.*',
            '**/vercel.json',
            '**/dangerfile.*',
            '**/scripts/**',
            '**/tools/**',
            '**/migrations/**',
            '**/supabase/**',
            '**/database/**',
          ],
          optionalDependencies: false,
        },
      ],
    },
  },

  // Test files configuration
  {
    files: [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/tests/**/*.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      'jest*.js',
      '**/*.setup.js',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/order': 'off',
      'import/newline-after-import': 'off',
      'import/extensions': 'off',
      'import/first': 'off',
      'no-console': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // UI components - reduce noise from withOptional warnings
  {
    files: ['components/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
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
        // Removed SpreadElement warning for UI components to reduce noise
      ],
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts}', '*.config.*.{js,ts}', 'dangerfile.js', '**/webpack.config*.js', '**/next.config*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
    },
  },

  // JavaScript files: allow require() for Node.js scripts
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Tool files (.mjs) - Node.js environment
  {
    files: ['tools/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off', // Node.js globals are available
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // K6 load testing scripts
  {
    files: ['k6/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
        open: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off', // K6 globals
      'import/no-extraneous-dependencies': 'off',
      'no-console': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.eslintcache*',
      '*.min.js',
      'public/**',
      '*.d.ts',
      'playwright-report/**',
      'test-results/**',
      'archive/**',
      'tests/archive/**',
      'tests/e2e/specs/_archived/**',
      '**/_archived/**',
      'archive-*/**',
      'app/archive-*/**',
      '_reports/**',
      'tests/e2e/archive-old/**',
      'archive-unused-files/**',
      'scratch/**',
      'vercel.json',
      '**/*.disabled',
      '**/*.disabled.*',
      '**/scripts.disabled/**',
      '**/tests.disabled/**',
    ],
  },
];
