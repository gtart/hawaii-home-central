import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
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
              "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.googletagmanager.com https://lh3.googleusercontent.com",
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
        source: '/tools/decision-points',
        destination: '/resources/renovation-stages',
        permanent: true,
      },
      {
        source: '/tools/hold-points',
        destination: '/resources/renovation-stages',
        permanent: true,
      },
      {
        source: '/resources/playbooks/decision-points',
        destination: '/resources/renovation-stages',
        permanent: true,
      },
      {
        source: '/resources/playbooks/hold-points',
        destination: '/resources/renovation-stages',
        permanent: true,
      },
      {
        source: '/app/tools/hold-points',
        destination: '/app/tools/finish-decisions',
        permanent: true,
      },
      {
        source: '/app/tools/decision-tracker',
        destination: '/app/tools/finish-decisions',
        permanent: true,
      },
      {
        source: '/app/tools/decision-tracker/:path*',
        destination: '/app/tools/finish-decisions/:path*',
        permanent: true,
      },
      {
        source: '/tools/fair-bid-checklist',
        destination: '/resources/playbooks/fair-bid-checklist',
        permanent: true,
      },
      {
        source: '/tools/responsibility-matrix',
        destination: '/resources/playbooks/responsibility-matrix',
        permanent: true,
      },
      {
        source: '/early-access',
        destination: '/waitlist',
        permanent: true,
      },
      {
        source: '/tools/finish-decisions',
        destination: '/tools',
        permanent: false,
      },
      {
        source: '/tools/before-you-sign',
        destination: '/tools',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
