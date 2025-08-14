/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/ia/:path*',
        destination: 'http://localhost:8081/api/:path*',
      },
      {
        source: '/api/po/:path*',
        destination: 'http://localhost:8082/api/:path*',
      },
    ]
  },
}

export default nextConfig
