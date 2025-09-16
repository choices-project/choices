/**
 * ESLint Boundaries Configuration
 * 
 * Enforces architectural boundaries between app layers.
 * Blocks features→features imports to prevent circular dependencies.
 */

module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'app/**' },
      { type: 'features', pattern: 'features/*/**' },
      { type: 'lib', pattern: 'lib/**' },
      { type: 'components', pattern: 'components/**' }
    ],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'app', to: ['features','lib','components'] },
        { from: 'components', to: ['lib'] },
        { from: 'features', to: ['lib'] },            // ✅ allowed
        { from: 'features', to: ['features'], disallow: true }, // ❌ block
        { from: 'lib', to: ['lib'], allow: true },    // libs can depend on libs
      ],
    }],
  }
};