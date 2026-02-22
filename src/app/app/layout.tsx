import type { Metadata } from 'next'
import { ProjectKeyWrapper } from '@/components/app/ProjectKeyWrapper'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProjectKeyWrapper>{children}</ProjectKeyWrapper>
}
