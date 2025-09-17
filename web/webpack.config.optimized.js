/**
 * Optimized Webpack Configuration
 * 
 * This configuration provides advanced webpack optimizations
 * for bundle size reduction and performance improvement.
 */

import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export default (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;
  const analyzeBundle = process.env.ANALYZE === 'true';

  return {
    // Entry configuration
    entry: {
      main: './src/index.tsx',
    },

    // Output configuration
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
      clean: true,
      publicPath: '/',
    },

    // Module resolution
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './'),
        '@components': path.resolve(__dirname, './components'),
        '@lib': path.resolve(__dirname, './lib'),
        '@utils': path.resolve(__dirname, './utils'),
        '@types': path.resolve(__dirname, './types'),
        '@hooks': path.resolve(__dirname, './hooks'),
        '@contexts': path.resolve(__dirname, './contexts'),
      },
      modules: ['node_modules'],
    },

    // Module rules
    module: {
      rules: [
        // TypeScript/JavaScript
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { browsers: ['> 1%', 'last 2 versions'] } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                ['@babel/preset-typescript'],
              ],
              plugins: [
                // Tree shaking support
                '@babel/plugin-syntax-dynamic-import',
                // Dead code elimination
                '@babel/plugin-transform-runtime',
              ],
            },
          },
        },

        // CSS/SCSS
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: isProduction ? '[hash:base64:8]' : '[local]--[hash:base64:5]',
                },
                importLoaders: 1,
              },
            },
            'postcss-loader',
          ],
        },

        // Images
        {
          test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8KB
            },
          },
          generator: {
            filename: 'images/[name].[contenthash:8][ext]',
          },
        },

        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[contenthash:8][ext]',
          },
        },
      ],
    },

    // Optimization configuration
    optimization: {
      // Enable tree shaking
      usedExports: true,
      sideEffects: false,

      // Module concatenation
      concatenateModules: isProduction,

      // Minimization
      minimize: isProduction,
      minimizer: isProduction ? [
        // Terser for JavaScript
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        // CSS minification
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                colormin: true,
                minifySelectors: true,
              },
            ],
          },
        }),
      ] : [],

      // Code splitting
      splitChunks: {
        chunks: 'all',
        minSize: 20000, // 20KB
        maxSize: 244000, // 250KB
        cacheGroups: {
          // Framework chunk
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          
          // UI Library chunk
          ui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 35,
            enforce: true,
          },
          
          // Supabase chunk
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          
          // WebAuthn chunk
          webauthn: {
            test: /[\\/]node_modules[\\/]@simplewebauthn[\\/]/,
            name: 'webauthn',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          
          // Charts and visualization
          charts: {
            test: /[\\/]node_modules[\\/](recharts|framer-motion)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority|zod|uuid)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          
          // State management
          state: {
            test: /[\\/]node_modules[\\/](zustand|@tanstack[\\/]react-query)[\\/]/,
            name: 'state',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
            enforce: true,
            maxSize: 244000,
          },
          
          // Common chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 1,
            reuseExistingChunk: true,
            maxSize: 244000,
          },
        },
      },

      // Runtime chunk
      runtimeChunk: {
        name: 'runtime',
      },
    },

    // Plugins
    plugins: [
      // Environment variables
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),

      // Bundle analyzer (conditional)
      ...(analyzeBundle ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json',
        }),
      ] : []),

      // Progress plugin
      new webpack.ProgressPlugin({
        activeModules: false,
        entries: true,
        handler(percentage, _message, ..._args) {
          if (percentage === 1) {
            console.log('✅ Webpack build completed');
          }
        },
      }),
    ],

    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500KB
      maxAssetSize: 512000, // 500KB
      assetFilter: (assetFilename) => {
        return /\.(js|css)$/.test(assetFilename);
      },
    },

    // Development server
    devServer: isDevelopment ? {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    } : undefined,

    // Source maps
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    // Stats
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      assets: true,
      entrypoints: false,
      timings: true,
      builtAt: true,
      version: true,
    },
  };
};
