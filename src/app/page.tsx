import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorksStrip } from '@/components/home/HowItWorksStrip'
import { FeatureCards } from '@/components/home/FeatureCards'
import { WhatYouGetSection } from '@/components/home/WhatYouGetSection'
import { AboutSection } from '@/components/home/AboutSection'
import { WaitlistSection } from '@/components/home/WaitlistSection'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/app')

  return (
    <>
      <HeroSection />
      <HowItWorksStrip />
      <FeatureCards />
      <WhatYouGetSection />
      <AboutSection />
      <WaitlistSection />
    </>
  )
}
