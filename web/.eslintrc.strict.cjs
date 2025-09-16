module.exports = {
  extends: ['./.eslintrc.cjs'],
  plugins: ['eslint-comments'],
  overrides: [
    // SERVER: everything under app/** except client components
    {
      files: [
        "app/**/route.{ts,tsx}",
        "app/**/layout.{ts,tsx}",
        "app/**/page.{ts,tsx}",           // still server by default unless "use client"
        "lib/**/{*,*.*}.{ts,tsx}",
        "server/**/{*,*.*}.{ts,tsx}",
        "utils/**/{*,*.*}.{ts,tsx}",
      ],
      excludedFiles: ["**/*client.{ts,tsx}", "**/*.client.{ts,tsx}", "**/components/**"], // exclude client components
      rules: {
        "no-restricted-globals": ["error",
          "window","document","navigator","location","HTMLElement",
          "localStorage","sessionStorage","Image","FileReader","MutationObserver",
        ],
        "no-restricted-syntax": [
          "error",
          { "selector": "MemberExpression[object.name='globalThis'][property.name='window']", "message": "No browser APIs on server" },
          { "selector": "MemberExpression[object.name='window']", "message": "No direct window access on server - use '@/lib/ssr-safe'" },
          { "selector": "MemberExpression[object.name='document']", "message": "No direct document access on server - use '@/lib/ssr-safe'" },
          { "selector": "MemberExpression[object.name='navigator']", "message": "No direct navigator access on server - use '@/lib/ssr-safe'" }
        ],
        "no-restricted-imports": ["error", {
          "paths": [
            { "name": "@/lib/browser-utils", "message": "Use '@/lib/ssr-safe' exports instead for server-side code" }
          ],
          "patterns": [
            { "group": ["*fontfaceobserver*", "*web-vitals*"], "message": "Client-only library used on server" }
          ]
        }]
      }
    },
    {
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        // Prefer TS rule over core eslint
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            // Do NOT allow underscore bypasses in app code:
            "args": "all",
            "argsIgnorePattern": "^$",       // nothing is ignored
            "varsIgnorePattern": "^$",       // nothing is ignored
            "caughtErrors": "all",
            "caughtErrorsIgnorePattern": "^$", 
            "ignoreRestSiblings": true       // still allow `{ a, ...rest }` patterns
          }
        ]
      }
    },
    {
      files: ["**/*.{js,jsx}"],
      rules: {
        "no-unused-vars": [
          "error", 
          { 
            "argsIgnorePattern": "^$",       // nothing is ignored
            "varsIgnorePattern": "^$",       // nothing is ignored
            "caughtErrorsIgnorePattern": "^$",
            "ignoreRestSiblings": true
          }
        ]
      }
    },
    // Tests may legitimately have unused args (Jest signatures, data builders)
    {
      files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', {
          "args": "all",
          "argsIgnorePattern": "^_",   // allow `_` in tests only
          "varsIgnorePattern": "^_$"
        }],
        "no-unused-vars": ['error', {
          "argsIgnorePattern": "^_",   // allow `_` in tests only
          "varsIgnorePattern": "^_$"
        }]
      }
    }
  ],
  rules: {
    // Make other rules strict too
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "react/no-unescaped-entities": "error",
    "@next/next/no-img-element": "error",
    "react-hooks/exhaustive-deps": "error",
    "prefer-const": "error",
    // ESLint comments enforcement
    "eslint-comments/disable-enable-pair": ["error", { "allowWholeFile": true }],
    "eslint-comments/no-unused-disable": "error",
    "eslint-comments/require-description": ["error", { "ignore": [] }]
  }
};