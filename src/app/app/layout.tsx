import type { Metadata } from 'next'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { NewsletterPromptWrapper } from '@/components/auth/NewsletterPromptWrapper'
import { ProjectKeyWrapper } from '@/components/app/ProjectKeyWrapper'
import { AppShell } from '@/components/app/AppShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <AppShell>
        <ProjectKeyWrapper>{children}</ProjectKeyWrapper>
      </AppShell>
      <NewsletterPromptWrapper />
    </ProjectProvider>
  )
}
