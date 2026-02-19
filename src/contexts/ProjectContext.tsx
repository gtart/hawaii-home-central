'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type ProjectRole = 'OWNER' | 'MEMBER'
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'TRASHED'

export interface ProjectInfo {
  id: string
  name: string
  status: ProjectStatus
  role: ProjectRole
  createdAt: string
}

interface ProjectContextValue {
  currentProject: ProjectInfo | null
  projects: ProjectInfo[]
  isLoading: boolean
  switchProject: (projectId: string) => Promise<void>
  createProject: (name: string) => Promise<string>
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) return
      const data = await res.json()
      setProjects(data.projects)
      setCurrentProjectId(data.currentProjectId)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const switchProject = useCallback(async (projectId: string) => {
    const res = await fetch('/api/projects/current', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
    if (!res.ok) throw new Error('Failed to switch project')

    setCurrentProjectId(projectId)
    // Force full reload so useToolState refetches for new project
    router.refresh()
  }, [router])

  const createProject = useCallback(async (name: string) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Failed to create project')
    const data = await res.json()
    const newProject = data.project as ProjectInfo

    setProjects((prev) => [...prev, newProject])
    setCurrentProjectId(newProject.id)
    router.refresh()
    return newProject.id
  }, [router])

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        isLoading,
        switchProject,
        createProject,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
