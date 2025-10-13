module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-env': {
          targets: {
            node: 'current',
          },
        },
      },
    ],
  ],
  plugins: [
    // Transform ESM imports for Jest
    ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
  ],
  env: {
    test: {
      presets: [
        [
          'next/babel',
          {
            'preset-env': {
              targets: {
                node: 'current',
              },
            },
          },
        ],
      ],
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
      ],
    },
  },
}