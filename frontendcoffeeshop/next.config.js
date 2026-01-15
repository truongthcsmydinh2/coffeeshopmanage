/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/functions',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      // /api/* is handled by src/app/api/[...path]/route.ts
      // /orders/* and /order-items/* use rewrites because they have page.tsx files
      {
        source: '/orders/:path*',
        destination: `${process.env.API_URL || 'http://backend:8000'}/orders/:path*`,
      },
      // Proxy image requests to the backend
      {
        source: '/image/:path*',
        destination: `${process.env.API_URL || 'http://backend:8000'}/image/:path*`,
      },
      {
        source: '/order-items/:path*',
        destination: `${process.env.API_URL || 'http://backend:8000'}/order-items/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${process.env.API_URL || 'http://backend:8000'}/ws/:path*`,
      },
    ]
  },
}

module.exports = nextConfig 