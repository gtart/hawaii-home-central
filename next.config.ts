import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/guides',
        destination: '/resources',
        permanent: true,
      },
      {
        source: '/tools/:slug/run',
        destination: '/app/tools/:slug',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
