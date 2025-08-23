/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the source directory to web
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  
  // This is a bridge config for Vercel detection
  // The actual config is in web/next.config.mjs
}

export default nextConfig
