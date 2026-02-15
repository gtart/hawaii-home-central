import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.googletagmanager.com",
              "font-src 'self'",
              "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://*.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
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
      {
        source: '/tools/hold-points',
        destination: '/tools/decision-points',
        permanent: true,
      },
      {
        source: '/resources/playbooks/hold-points',
        destination: '/resources/playbooks/decision-points',
        permanent: true,
      },
      {
        source: '/app/tools/hold-points',
        destination: '/app/tools/finish-decisions',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
