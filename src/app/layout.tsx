import type { Metadata } from 'next'
import Script from 'next/script'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ProjectProvider } from '@/contexts/ProjectContext'
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
      <body className="bg-basalt text-cream font-sans antialiased min-h-screen flex flex-col overflow-x-hidden">
        <AuthProvider>
          <ProjectProvider>
            <Navigation />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <NewsletterPromptWrapper />
          </ProjectProvider>
        </AuthProvider>
        <NoiseOverlay />
        <Analytics />
        <Script
          src="https://us-assets.i.posthog.com/static/array.js"
          strategy="lazyOnload"
        />
        <Script id="posthog-init" strategy="lazyOnload">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_4uGAOTNvdXFYi8Kzhtw0YvcnOfbmSwHz6EyCs4ld2xP',{api_host:'https://us.i.posthog.com',person_profiles:'identified_only'});
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G64TMLBFEC"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
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
