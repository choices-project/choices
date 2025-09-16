/* eslint-env node */
module.exports = {
  root: false,
  extends: ['./.eslintrc.cjs', './eslint/.eslintrc.layers.cjs'],
  parserOptions: {
    // Type-aware rules go here; aim at a strict tsconfig
    project: ['./tsconfig.strict.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    // Turn on stricter style/safety as you like:
    // '@typescript-eslint/no-unsafe-assignment': 'error',
    // '@typescript-eslint/no-unsafe-call': 'error',
  },
};