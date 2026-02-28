'use client'

import { useProject } from '@/contexts/ProjectContext'

export function AppPageHeader() {
  const { currentProject } = useProject()
  const name = currentProject?.name ?? 'My Project'

  return (
    <div className="mb-8">
      <h1 className="font-serif text-3xl md:text-4xl text-sandstone">
        {name}
      </h1>
      <p className="text-cream/50 text-sm mt-2">
        Your renovation tools — pick any and jump in.
      </p>
    </div>
  )
}
