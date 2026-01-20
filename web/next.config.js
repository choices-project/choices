// @ts-check
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const defaultDevOrigins = ['http://127.0.0.1:3000', 'http://localhost:3000'];
const envDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedDevOrigins = Array.from(new Set([...defaultDevOrigins, ...envDevOrigins]));
const allowedDevWsOrigins = allowedDevOrigins.map((origin) => {
  if (origin.startsWith('https://')) {
    return origin.replace('https://', 'wss://');
  }
  if (origin.startsWith('http://')) {
    return origin.replace('http://', 'ws://');
  }
  return origin;
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification for better performance
  swcMinify: true,
  reactStrictMode: process.env.NEXT_DISABLE_STRICT_MODE === '1' ? false : true,
  transpilePackages: ['@choices/civics-shared'],
  // Ensure standalone output so Docker copy of .next/standalone exists
  output: 'standalone',

  experimental: {
    // Next 14 way to opt packages out of RSC bundling (Node will require them at runtime)
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/realtime-js',
      '@supabase/supabase-js',
      '@vercel/og',
      // Externalize all Supabase packages to prevent browser globals in server bundles
    ],
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
      { protocol: 'https', hostname: '**.gov' },
      { protocol: 'http', hostname: '**.gov' },
      { protocol: 'https', hostname: '**.us' },
      { protocol: 'http', hostname: '**.us' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.joincalifornia.com' },
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      { protocol: 'https', hostname: 'www.assembly.ca.gov' },
      { protocol: 'https', hostname: 'unitedstates.github.io' }
    ]
  },

  webpack: (config, { isServer, webpack }) => {
    const isDev = process.env.NODE_ENV === 'development'

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
      // Handle @vercel/og for OG image generation in Edge Runtime
      // Exclude it from webpack bundling since it's used in Edge Runtime
      // Also exclude from middleware bundle to prevent WASM dependency issues
      config.resolve.alias = {
        ...config.resolve.alias,
        '@vercel/og': false,
      };

      // Exclude Supabase packages from middleware bundle (Edge Runtime incompatible)
      // These should only be used in API routes with Node.js runtime
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/ssr': false,
        '@supabase/supabase-js': false,
      };

      // Define browser globals as undefined for server-side compatibility
      config.plugins.push(new webpack.DefinePlugin({
        self: JSON.stringify('globalThis'),
        window: undefined,
        document: undefined,
        navigator: undefined,
        localStorage: undefined,
        sessionStorage: undefined,
        location: undefined,
        HTMLElement: undefined,
        // Additional browser globals that might leak
        'window.location': undefined,
        'document.location': undefined,
        'navigator.userAgent': undefined,
        'navigator.clipboard': undefined,
        'window.localStorage': undefined,
        'window.sessionStorage': undefined
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

      // Add file-loader for @vercel/og
      config.module.rules.push({
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/',
            outputPath: 'static/',
          },
        },
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

    // Bundle size optimizations (production-only to avoid dev chunk 404s)
    if (!isServer && !isDev) {
      // More aggressive code splitting for both dev and prod
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 10000, // 10KB minimum
          maxSize: 200000, // 200KB maximum - force splitting
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            // React core - split from react-dom
            react: {
              test: /[\\/]node_modules[\\/]react[\\/]/,
              name: 'react',
              priority: 50,
              enforce: true,
            },
            // React-dom separately (it's huge in dev)
            reactDom: {
              test: /[\\/]node_modules[\\/]react-dom[\\/]/,
              name: 'react-dom',
              priority: 50,
              enforce: true,
              maxSize: 500000, // Allow larger for dev builds
            },
            // Next.js framework - split into smaller chunks
            nextFramework: {
              test: /[\\/]node_modules[\\/]next[\\/]/,
              name(/** @type {any} */ module) {
                const match = module.context.match(/[\\/]node_modules[\\/]next[\\/](.*?)[\\/]/);
                if (match && match[1]) {
                  return `next-${match[1]}`;
                }
                return 'next-core';
              },
              priority: 40,
              enforce: true,
              maxSize: 200000,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|clsx|tailwind-merge)[\\/]/,
              name: 'ui',
              priority: 30,
              enforce: true,
            },
            // Data libraries
            data: {
              test: /[\\/]node_modules[\\/](@tanstack|@supabase|zod)[\\/]/,
              name: 'data',
              priority: 25,
              enforce: true,
            },
            // Charts library (heavy)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              chunks: 'async', // Only load when needed
              priority: 20,
            },
            // Motion library (heavy)
            motion: {
              test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
              name: 'motion',
              chunks: 'async', // Only load when needed
              priority: 20,
            },
            // Other vendor libraries - split by package
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name(/** @type {any} */ module) {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                const packageName = match && match[1] ? match[1] : 'vendor';
                return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
              },
              priority: 10,
              reuseExistingChunk: true,
              maxSize: 150000,
            },
            // Common application code
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              maxSize: 100000,
            }
          }
        },
        // Minimize runtime overhead
        runtimeChunk: {
          name: 'runtime',
        },
      }
    }

    if (!isServer) {
      config.performance = {
        ...config.performance,
        hints: isDev ? false : 'warning', // Disable warnings in dev
        maxEntrypointSize: isDev ? 5_000_000 : 512_000, // 5MB in dev, 500KB in prod
        maxAssetSize: isDev ? 1_000_000 : 512_000, // 1MB in dev, 500KB in prod
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
    // Check if we're in a Vercel preview environment (not production)
    // Also check VERCEL_URL to detect Vercel deployments
    const isVercelPreview =
      process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'development' ||
      (process.env.VERCEL_URL && !isProduction)

    // CSP configuration with two profiles: production and development
    const cspDirectives = {
      production: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for Next.js development
          // Only include vercel.live in preview/development environments, not production
          ...(isVercelPreview ? ['https://vercel.live'] : []),
          'https://vercel.com', // Vercel analytics (safe for production)
          'https://challenges.cloudflare.com', // Turnstile
          'https://static.cloudflareinsights.com', // Cloudflare analytics
        ],
        // Explicitly set script-src-elem to match script-src for modern browsers
        'script-src-elem': [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for Next.js development
          // Only include vercel.live in preview/development environments, not production
          ...(isVercelPreview ? ['https://vercel.live'] : []),
          'https://vercel.com', // Vercel analytics (safe for production)
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
          // Only include vercel.live in preview/development environments, not production
          ...(isVercelPreview ? ['https://vercel.live'] : []),
          'https://vitals.vercel-insights.com',
          'https://challenges.cloudflare.com', // Turnstile
          'https://fonts.googleapis.com', // Google Fonts
          'https://fonts.gstatic.com', // Google Fonts
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
          'http://127.0.0.1:*',
          'https://vercel.live',
          'https://challenges.cloudflare.com', // Turnstile
          ...allowedDevOrigins,
        ],
        // Explicitly set script-src-elem to match script-src for modern browsers
        'script-src-elem': [
          "'self'",
          "'unsafe-inline'",
          'http://localhost:*',
          'http://127.0.0.1:*',
          'https://vercel.live',
          'https://challenges.cloudflare.com', // Turnstile
          ...allowedDevOrigins,
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          ...allowedDevOrigins,
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
          'http://127.0.0.1:*',
          ...allowedDevOrigins,
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'https://*.supabase.io',
          'http://localhost:*',
          'ws://localhost:*',
          'http://127.0.0.1:*',
          'ws://127.0.0.1:*',
          'https://fonts.googleapis.com', // Google Fonts
          'https://fonts.gstatic.com', // Google Fonts
          ...allowedDevOrigins,
          ...allowedDevWsOrigins,
          'wss://*.supabase.co',
          'wss://*.supabase.io',
        ],
        'media-src': [
          "'self'",
          'data:',
          'blob:',
          'http://localhost:*',
          'http://127.0.0.1:*',
          ...allowedDevOrigins,
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

    const headerRules = [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: isReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
            value: cspString
          },
          ...(allowedDevOrigins.length
            ? [
                {
                  key: 'X-Allowed-Dev-Origins',
                  value: allowedDevOrigins.join(', ')
                }
              ]
            : []),
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

    if (process.env.NODE_ENV === 'development') {
      headerRules.unshift({
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      })
    }

    return headerRules
  },

  // Redirects for performance
  async redirects() {
    return [
      // Canonical domain redirect - redirect non-www to www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'choices-app.com',
          },
        ],
        destination: 'https://www.choices-app.com/:path*',
        permanent: true, // 308 redirect
      },
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false // Fix TypeScript errors properly, don't hide them
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false
  },

  // Output configuration - enable for Docker deployments
  // Disable standalone mode on Vercel/CI to avoid route group build issues
  // Vercel uses its own serverless deployment system and doesn't need standalone
  // Also disable in CI environments to prevent build errors
  // Always disable standalone mode to prevent client reference manifest errors
  // output: 'standalone' is disabled to avoid route group build issues

  // Trailing slash
  trailingSlash: false,

  // Base path
  basePath: '',

  // Asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // Allow local tunnels / alternate hosts during dev server runs
  allowedDevOrigins,
}

export default bundleAnalyzer(nextConfig);
