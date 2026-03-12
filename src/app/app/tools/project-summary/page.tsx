import type { Metadata } from 'next'
import { ProjectSummaryWorkspaceLoader } from './ProjectSummaryWorkspaceLoader'

export const metadata: Metadata = {
  title: 'Project Summary',
}

export default function ProjectSummaryPage() {
  return <ProjectSummaryWorkspaceLoader />
}
