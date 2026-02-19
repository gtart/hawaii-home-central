import type { Metadata } from 'next'
import Script from 'next/script'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { NewsletterPromptWrapper } from '@/components/auth/NewsletterPromptWrapper'
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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Hawaii Home Central' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hawaii Home Central | Renovate with Confidence',
    description:
      'A Hawaiʻi-first guide to renovating, maintaining, and loving your home.',
    images: ['/og-image.png'],
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
          <NewsletterPromptWrapper />
        </AuthProvider>
        <NoiseOverlay />
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G64TMLBFEC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G64TMLBFEC');
          `}
        </Script>
      </body>
    </html>
  )
}
