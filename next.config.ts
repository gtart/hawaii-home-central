import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/tools/:slug/run',
        destination: '/app/tools/:slug',
        permanent: false,
      },
      {
        source: '/guides/:path*',
        destination: '/hawaii-home-renovation/:path*',
        permanent: true,
      },
      {
        source: '/guides',
        destination: '/hawaii-home-renovation',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
