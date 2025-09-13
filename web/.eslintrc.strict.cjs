module.exports = {
  extends: ['./.eslintrc.base.cjs'],
  plugins: ['eslint-comments'],
  overrides: [
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
