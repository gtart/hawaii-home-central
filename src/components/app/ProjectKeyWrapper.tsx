'use client'

import { useSession } from 'next-auth/react'
import { useProject } from '@/contexts/ProjectContext'
import type { ReactNode } from 'react'

/**
 * Wraps children with a key based on the current project ID.
 * When the project changes, React unmounts and remounts all children,
 * causing useToolState hooks to refetch data for the new project.
 *
 * Project creation is handled server-side by resolveCurrentProject()
 * in GET /api/projects. No client-side auto-create — that caused
 * duplicate "My Home" projects due to race conditions with concurrent
 * API calls (projects + tool GETs all calling resolveCurrentProject).
 */
export function ProjectKeyWrapper({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const { currentProject, isLoading, createProject } = useProject()

  if (status === 'loading' || isLoading) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-cream/5 rounded" />
            <div className="h-4 w-72 bg-cream/5 rounded" />
            <div className="h-32 bg-cream/5 rounded-card mt-8" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return <NoProjectsFallback onCreate={createProject} />
  }

  return <div key={currentProject.id}>{children}</div>
}

function NoProjectsFallback({ onCreate }: { onCreate: (name: string) => Promise<string> }) {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-md mx-auto text-center">
        <svg className="w-12 h-12 text-cream/20 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="font-serif text-2xl text-sandstone mb-2">Welcome to Hawaii Home Central</h2>
        <p className="text-cream/50 text-sm mb-6 leading-relaxed">
          Create your first home project to get started with Mood Boards, Finish Selections, and more.
        </p>
        <button
          type="button"
          onClick={() => onCreate('My Home')}
          className="px-6 py-2.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
        >
          Create my home
        </button>
      </div>
    </div>
  )
}
