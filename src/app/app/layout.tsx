import type { Metadata } from 'next'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { ProjectKeyWrapper } from '@/components/app/ProjectKeyWrapper'
import { AppNavigation } from '@/components/app/AppNavigation'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <AppNavigation />
      <ProjectKeyWrapper>{children}</ProjectKeyWrapper>
    </ProjectProvider>
  )
}
