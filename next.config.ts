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
        source: '/tools',
        destination: '/resources',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
