const js = require('@eslint/js')
const nextPlugin = require('@next/eslint-plugin-next')
const reactPlugin = require('eslint-plugin-react')
const reactHooksPlugin = require('eslint-plugin-react-hooks')

module.exports = [
  js.configs.recommended,
  // SERVER: everything under app/** except client components
  {
    files: [
      'app/**/route.{ts,tsx}',
      'app/**/layout.{ts,tsx}',
      'app/**/page.{ts,tsx}',           // still server by default unless "use client"
      'lib/**/{*,*.*}.{ts,tsx}',
      'server/**/{*,*.*}.{ts,tsx}',
      'utils/**/{*,*.*}.{ts,tsx}',
    ],
    ignores: ['**/*client.{ts,tsx}', '**/*.client.{ts,tsx}', '**/components/**'], // exclude client components
    rules: {
      'no-restricted-globals': ['error',
        'window','document','navigator','location','HTMLElement',
        'localStorage','sessionStorage','Image','FileReader','MutationObserver',
      ],
      'no-restricted-syntax': [
        'error',
        { 'selector': 'MemberExpression[object.name=\'globalThis\'][property.name=\'window\']', 'message': 'No browser APIs on server' },
        { 'selector': 'MemberExpression[object.name=\'window\']', 'message': 'No direct window access on server - use \'@/lib/ssr-safe\'' },
        { 'selector': 'MemberExpression[object.name=\'document\']', 'message': 'No direct document access on server - use \'@/lib/ssr-safe\'' },
        { 'selector': 'MemberExpression[object.name=\'navigator\']', 'message': 'No direct navigator access on server - use \'@/lib/ssr-safe\'' }
      ],
      'no-restricted-imports': ['error', {
        'paths': [
          { 'name': '@/lib/browser-utils', 'message': 'Use \'@/lib/ssr-safe\' exports instead for server-side code' }
        ],
        'patterns': [
          { 'group': ['*fontfaceobserver*', '*web-vitals*'], 'message': 'Client-only library used on server' }
        ]
      }]
    }
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      
      // React rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General rules
      'no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'e2e/**',
      'test-results/**',
      'playwright-report/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      'public/**',
      'next.config.mjs',
      'middleware.ts',
      'types/**',
      'utils/**',
    ],
  },
]
