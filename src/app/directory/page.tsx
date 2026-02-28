import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Directory',
  description: 'Find island-ready contractors and trades in Hawaiʻi — built on real referrals from homeowners and trusted pros.',
}

export default function DirectoryPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <Badge variant="accent" className="mb-4">Coming Soon</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Trusted Pros Directory
          </h1>
          <p className="text-lg text-cream/70 mb-8 max-w-2xl mx-auto">
            Find island-ready contractors and trades — built on real referrals from homeowners and trusted pros who know Hawai&#x02BB;i.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8 mb-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              How We&apos;re Building It
            </h2>
            <ul className="text-left text-cream/70 space-y-3">
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Referrals from homeowners and trusted professionals in the trades</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Transparent reviews from actual clients</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Specialty and location-based filtering</span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <p className="text-cream/50 mb-6">
            Be first to know when the directory is ready.
          </p>
          <Link href="/waitlist">
            <Button size="lg">Request Early Access</Button>
          </Link>
        </FadeInSection>
      </div>
    </div>
  )
}
