'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useProject } from '@/contexts/ProjectContext'
import type { ReactNode } from 'react'

/**
 * Wraps children with a key based on the current project ID.
 * When the project changes, React unmounts and remounts all children,
 * causing useToolState hooks to refetch data for the new project.
 *
 * Auto-creates a default "My Home" project when none exist,
 * with a manual fallback button if auto-create fails.
 */
export function ProjectKeyWrapper({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const { currentProject, isLoading, createProject } = useProject()
  const creatingRef = useRef(false)
  const failedRef = useRef(false)
  // One-shot guard: only allow auto-create once per component mount
  const didAutoCreateRef = useRef(false)

  useEffect(() => {
    // Never auto-create unless auth is definitively settled and authenticated
    if (status !== 'authenticated') return
    if (isLoading || currentProject || creatingRef.current || failedRef.current) return
    if (didAutoCreateRef.current) return

    didAutoCreateRef.current = true
    creatingRef.current = true
    createProject('My Home').catch(() => {
      failedRef.current = true
    }).finally(() => {
      creatingRef.current = false
    })
  }, [status, isLoading, currentProject, createProject])

  if (isLoading) {
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
    if (failedRef.current) {
      return <NoProjectsFallback onCreate={createProject} />
    }
    // Auto-create in progress
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/50 text-sm">Setting up your home...</p>
        </div>
      </div>
    )
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
        <h2 className="font-serif text-2xl text-sandstone mb-2">Something went wrong</h2>
        <p className="text-cream/50 text-sm mb-6 leading-relaxed">
          We couldn&apos;t set up your home automatically. Click below to try again.
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
