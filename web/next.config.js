const withPWA = require('next-pwa')({
  dest: 'public',
  // Disable SW in dev, enable in prod, or when explicitly disabled
  disable: process.env.NODE_ENV === 'development' || process.env.NEXT_DISABLE_PWA === '1',
  register: true,
  skipWaiting: true,

  // Keep runtimeCaching VERY simple; bad shapes trigger the "properties" error
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-images',
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],

  // Useful to avoid SW picking up Next internals
  buildExcludes: [/middleware-manifest\.json$/],
})

// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14 way to opt packages out of RSC bundling (Node will require them at runtime)
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/realtime-js',
      // ⚠️ DO NOT list '@supabase/supabase-js' here; keep that strictly client-side.
    ],
    // Disable CSS optimization to avoid critters dependency issues
    optimizeCss: false,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'lodash-es',
      'react-hook-form',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
    // Enable turbo for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },

  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // ⛔️ Remove these lines if present in your current config:
      // config.resolve.conditionNames = [...]
      // config.resolve.mainFields = [...]
      // config.resolve.fallback = { crypto:false, stream:false, buffer:false, ... }

      // If you want a *temporary* guard, you can define `self` at compile time:
      // (safer than patching the output with a custom plugin)
      config.plugins.push(new webpack.DefinePlugin({ self: 'globalThis' }));
    }

    // ⛔️ Remove any custom plugin that rewrites emitted bundles (e.g., webpack-self-fix.js).

    // Bundle analyzer (only in development and when explicitly requested)
    if (!isServer && process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-analyzer-report.html'
          })
        )
      } catch (error) {
        console.warn('Bundle analyzer not available:', error.message)
      }
    }

    // Module resolution optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './')
    }

    // Bundle size optimizations
    if (!isServer) {
      // Optimize bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks - separate large libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
              maxSize: 244000, // ~250KB chunks
            },
            // React specific chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Supabase specific chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            }
          }
        }
      }

      // Performance hints
      config.performance = {
        ...config.performance,
        hints: 'warning',
        maxEntrypointSize: 512000, // 500KB
        maxAssetSize: 512000, // 500KB
      }
    }

    return config
  },

  // Compression
  compress: true,

  // Powered by header
  poweredByHeader: false,

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Redirects for performance
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false
  },

  // Output configuration
  output: 'standalone',

  // Trailing slash
  trailingSlash: false,

  // Base path
  basePath: '',

  // Asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',


}

module.exports = withPWA(nextConfig)
