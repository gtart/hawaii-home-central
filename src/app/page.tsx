import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { HeroSection } from '@/components/home/HeroSection'
import { AboutSection } from '@/components/home/AboutSection'
import { FeatureCards } from '@/components/home/FeatureCards'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/app')

  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeatureCards />
    </>
  )
}
