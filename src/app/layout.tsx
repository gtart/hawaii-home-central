import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { NoiseOverlay } from '@/components/effects/NoiseOverlay'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Hawaii Home Central | Renovate with Confidence',
    template: '%s | Hawaii Home Central',
  },
  description:
    'A Hawaiʻi-first guide to renovating, maintaining, and loving your home—built from real homeowner pain. Practical guides and tools, real lessons, and a trust-first pros directory.',
  keywords: [
    'Hawaii renovation',
    'home improvement Hawaii',
    'contractors Hawaii',
    'renovation guide',
    'home maintenance',
  ],
  authors: [{ name: 'Hawaii Home Central' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Hawaii Home Central',
    title: 'Hawaii Home Central | Renovate with Confidence',
    description:
      'A Hawaiʻi-first guide to renovating, maintaining, and loving your home.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hawaii Home Central | Renovate with Confidence',
    description:
      'A Hawaiʻi-first guide to renovating, maintaining, and loving your home.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-basalt text-cream font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <NoiseOverlay />
        <Analytics />
      </body>
    </html>
  )
}
