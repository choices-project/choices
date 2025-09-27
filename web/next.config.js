// @ts-check
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14 way to opt packages out of RSC bundling (Node will require them at runtime)
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/realtime-js',
      '@supabase/supabase-js',
      // Externalize all Supabase packages to prevent browser globals in server bundles
    ],
    // Enable SWC for better performance
    swcMinify: true,
    // Disable CSS optimization to avoid critters dependency issues
    optimizeCss: false,
    // Disable font optimization to prevent browser globals in server bundles
    optimizeServerReact: false,
    // Font optimization is disabled by default in Next.js 14+
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'recharts',
      'framer-motion',
      'uuid',
    ],
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
    // Exclude test files from compilation
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader'
    });
    
    // Exclude test directories
    config.module.rules.push({
      test: /tests\/.*\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader'
    });

    // Exclude social sharing components when feature is disabled
    if (process.env.SOCIAL_SHARING_ENABLED !== 'true') {
      config.module.rules.push({
        test: /components\/social\/.*\.(ts|tsx|js|jsx)$/,
        use: 'ignore-loader'
      });
      
      config.module.rules.push({
        test: /lib\/share\.(ts|tsx|js|jsx)$/,
        use: 'ignore-loader'
      });

      config.module.rules.push({
        test: /app\/p\/\[id\]\/opengraph-image\.(ts|tsx|js|jsx)$/,
        use: 'ignore-loader'
      });

      config.module.rules.push({
        test: /app\/api\/share\/.*\.(ts|tsx|js|jsx)$/,
        use: 'ignore-loader'
      });
    }

    if (isServer) {
      // Define browser globals as undefined for server-side compatibility
      config.plugins.push(new webpack.DefinePlugin({ 
        self: 'globalThis',
        window: 'undefined',
        document: 'undefined',
        navigator: 'undefined',
        localStorage: 'undefined',
        sessionStorage: 'undefined',
        location: 'undefined',
        HTMLElement: 'undefined',
        // Additional browser globals that might leak
        'window.location': 'undefined',
        'document.location': 'undefined',
        'navigator.userAgent': 'undefined',
        'navigator.clipboard': 'undefined',
        'window.localStorage': 'undefined',
        'window.sessionStorage': 'undefined'
      }));

      // Exclude font optimization and Supabase from server bundles
      config.externals = config.externals || [];
      config.externals.push({
        'next/font': 'commonjs next/font',
        'next/font/google': 'commonjs next/font/google',
        'next/font/local': 'commonjs next/font/local',
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
        '@supabase/ssr': 'commonjs @supabase/ssr',
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js'
      });

      // More aggressive Supabase externalization for server builds
      // @ts-expect-error - webpack callback types
      config.externals.push(({ request }, callback) => {
        if (isServer && request && request.includes('@supabase')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });

      // Prevent font optimization from including browser globals
      config.module.rules.push({
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/fonts/',
            outputPath: 'static/fonts/',
          },
        },
      });
    }

    // Module resolution optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('./', import.meta.url).pathname
    }

    // Bundle size optimizations
    if (!isServer) {
      // Optimize bundle splitting - more aggressive consolidation
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000, // 20KB minimum chunk size
          maxSize: 300000, // 300KB maximum chunk size
          minChunks: 1,
          maxAsyncRequests: 10, // Limit async chunks
          maxInitialRequests: 8, // Limit initial chunks
          cacheGroups: {
            // React specific chunk - highest priority
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // Next.js framework chunk
            nextjs: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: 'nextjs',
              chunks: 'all',
              priority: 35,
              enforce: true,
            },
            // UI libraries consolidated
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|clsx|tailwind-merge)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // Data & state management
            data: {
              test: /[\\/]node_modules[\\/](@tanstack|@supabase|zod)[\\/]/,
              name: 'data',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            // Charts and visualization - more aggressive splitting
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3|chart\.js|react-smooth)[\\/]/,
              name: 'charts',
              chunks: 'async', // Only load charts when needed
              priority: 20,
              enforce: true,
              maxSize: 100000, // 100KB max for charts
            },
            // Animation libraries - async loading
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion|lottie)[\\/]/,
              name: 'animations',
              chunks: 'async', // Only load animations when needed
              priority: 20,
              enforce: true,
              maxSize: 100000, // 100KB max for animations
            },
            // Utility libraries - async loading
            utils: {
              test: /[\\/]node_modules[\\/](date-fns|lodash-es|uuid)[\\/]/,
              name: 'utils',
              chunks: 'async', // Only load utils when needed
              priority: 15,
              enforce: true,
              maxSize: 50000, // 50KB max for utils
            },
            // All other vendor libraries - consolidated
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
              minChunks: 1,
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
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
    const isReportOnly = process.env.CSP_REPORT_ONLY === 'true'
    
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
        'report-uri': ['/api/csp-report'],
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
        'report-uri': ['/api/csp-report'],
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

  // ESLint configuration - temporarily disabled for bundle optimization testing
  eslint: {
    ignoreDuringBuilds: true
  },

  // Output configuration - removed standalone for Vercel compatibility
  // output: 'standalone',

  // Trailing slash
  trailingSlash: false,

  // Base path
  basePath: '',

  // Asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

export default bundleAnalyzer(nextConfig);