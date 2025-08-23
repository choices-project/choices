/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect all requests to the web directory
  async rewrites() {
    return [
      {
        source: '/(.*)',
        destination: '/web/$1',
      },
    ]
  },
  
  // Set the dist directory to web/.next
  distDir: 'web/.next',
  
  // This is a bridge config for Vercel detection
  // The actual config is in web/next.config.mjs
}

export default nextConfig
