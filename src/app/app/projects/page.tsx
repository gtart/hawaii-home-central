import type { Metadata } from 'next'
import { ProjectsContent } from './ProjectsContent'

export const metadata: Metadata = {
  title: 'My Projects',
}

export default function ProjectsPage() {
  return <ProjectsContent />
}
