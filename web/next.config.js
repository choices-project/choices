// @ts-check
const withBundleAnalyzer = require('@next/bundle-analyzer');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages (moved from experimental in Next.js 15)
  serverExternalPackages: [
    '@supabase/ssr',
    '@supabase/realtime-js',
    '@supabase/supabase-js'
  ],

  experimental: {
    // Advanced package imports optimization
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
      '@heroicons/react',
      'recharts',
      'framer-motion',
      'date-fns',
      'lodash-es',
      'uuid'
    ],
    // Next.js 15 features with performance optimizations
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Reduce memory usage
    workerThreads: false,
    // Aggressive bundle optimization
    optimizeCss: true,
    // Tree shaking optimization
    esmExternals: true,
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

  webpack: (config, { isServer, webpack, dev }) => {
    // Enhanced module resolution with performance optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './')
    }

    // Exclude service worker files from server build
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '/sw.js': 'commonjs /sw.js',
        '/workbox-*.js': 'commonjs /workbox-*.js'
      });
      
      // Add fallback for client-side globals
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'self': false,
        'window': false,
        'navigator': false,
        'document': false
      };
      
      // Exclude service worker files from server bundle
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.(sw|workbox)\.js$/,
        use: 'null-loader'
      });
    }

    // Performance optimizations
    if (!dev) {
      // Enable tree shaking in production
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      // Remove console logs in production
      minimize: !dev,
      // Enable gzip compression
      minimizer: [
        ...config.optimization.minimizer,
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: !dev,
              drop_debugger: !dev,
            },
          },
        }),
      ],
    }

    if (isServer) {
      // Enhanced server-side configuration
      config.externals = config.externals || [];
      config.externals.push({
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
        '@supabase/ssr': 'commonjs @supabase/ssr',
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js'
      });
    } else {
      // Client-side bundle optimization
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config
  },

  // Compression - temporarily disabled to fix ERR_CONTENT_DECODING_FAILED
  compress: false,

  // Modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
    'date-fns': { transform: 'date-fns/{{member}}' },
    'lodash-es': { transform: 'lodash-es/{{member}}' },
    '@radix-ui/react-*': { transform: '@radix-ui/react-{{member}}' },
    'recharts': { transform: 'recharts/esm/{{member}}' },
    'framer-motion': { transform: 'framer-motion/dist/es/{{member}}' },
    'uuid': { transform: 'uuid/dist/esm/{{member}}' },
  },

  // Powered by header
  poweredByHeader: false,

  // Headers for performance and security
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    const isReportOnly = process.env['CSP_REPORT_ONLY'] === 'true'
    
    // CSP configuration with two profiles: production and development
    const cspDirectives = {
      production: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for Next.js development
          'https://vercel.live', // Vercel preview
          'https://vercel.com', // Vercel analytics
          'https://challenges.cloudflare.com', // Turnstile
          'https://static.cloudflareinsights.com', // Cloudflare analytics
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS
          'https://fonts.googleapis.com',
        ],
        'font-src': [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
        ],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https:',
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'https://*.supabase.io',
          'https://vercel.live',
          'https://vitals.vercel-insights.com',
          'https://challenges.cloudflare.com', // Turnstile
          'wss://*.supabase.co',
          'wss://*.supabase.io',
        ],
        'media-src': [
          "'self'",
          'data:',
          'blob:',
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
        'report-uri': ['/api/feedback'],
      },
      development: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'http://localhost:*',
          'https://vercel.live',
          'https://challenges.cloudflare.com', // Turnstile
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        'font-src': [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
        ],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https:',
          'http://localhost:*',
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'https://*.supabase.io',
          'http://localhost:*',
          'ws://localhost:*',
          'wss://*.supabase.co',
          'wss://*.supabase.io',
        ],
        'media-src': [
          "'self'",
          'data:',
          'blob:',
          'http://localhost:*',
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'report-uri': ['/api/feedback'],
      }
    }

    const cspProfile = isProduction ? cspDirectives.production : cspDirectives.development
    const cspString = Object.entries(cspProfile)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: isReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
            value: cspString
          },
          // Trusted Types for DOM XSS protection
          {
            key: 'Trusted-Types',
            value: "'none'"
          },
          // HSTS (only in production, without preload for now)
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }] : []),
          // Basic security headers
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
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()', // Disable FLoC
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
            ].join(', ')
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          // Origin isolation
          {
            key: 'Origin-Agent-Cluster',
            value: '?1'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Vary',
            value: 'Cookie, Authorization'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          // Temporarily removed to fix ERR_CONTENT_DECODING_FAILED
          // {
          //   key: 'Content-Encoding',
          //   value: 'gzip'
          // }
        ]
      },
      {
        source: '/_next/static/chunks/(.*)',
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

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false
  },

  // ESLint configuration - temporarily disabled to test PWA component
  eslint: {
    ignoreDuringBuilds: true
  },

  // Output configuration - removed standalone for Vercel compatibility
  // output: 'standalone',
  
  // Fix workspace root detection
  outputFileTracingRoot: __dirname,

  // Trailing slash
  trailingSlash: false,

  // Base path
  basePath: '',

  // Asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = bundleAnalyzer(nextConfig);