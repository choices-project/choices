// Import the actual Next.js config from the web directory
const webConfig = require('./web/next.config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...webConfig,
  
  // Override the distDir to point to web/.next
  distDir: 'web/.next',
  
  // Set the source directory to web
  experimental: {
    ...webConfig.experimental,
    outputFileTracingRoot: require('path').join(__dirname, 'web'),
  },
}

module.exports = nextConfig;
