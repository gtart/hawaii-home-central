'use client'

import { useState, useRef, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { cn } from '@/lib/utils'

export function ProjectSwitcher() {
  const { currentProject, projects, isLoading, switchProject, createProject } = useProject()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Only show when user has 2+ projects
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE')
  if (isLoading || activeProjects.length < 2) return null

  const handleSwitch = async (projectId: string) => {
    if (projectId === currentProject?.id) {
      setOpen(false)
      return
    }
    await switchProject(projectId)
    setOpen(false)
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    await createProject(name)
    setNewName('')
    setCreating(false)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-cream/70 hover:text-cream transition-colors px-3 py-1.5 rounded-lg hover:bg-cream/5"
      >
        <svg className="w-4 h-4 text-sandstone/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">{currentProject?.name ?? 'Project'}</span>
        <svg className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-basalt-50 border border-cream/10 rounded-lg shadow-lg py-1">
            {activeProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSwitch(p.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors',
                  p.id === currentProject?.id
                    ? 'text-sandstone bg-sandstone/5'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                )}
              >
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === currentProject?.id && (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {p.role === 'MEMBER' && (
                  <span className="text-xs text-cream/30">shared</span>
                )}
              </button>
            ))}

            <div className="border-t border-cream/10 mt-1 pt-1">
              {creating ? (
                <div className="px-4 py-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                    placeholder="Project name..."
                    className="w-full bg-basalt border border-cream/20 rounded px-2.5 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleCreate}
                      className="flex-1 text-xs font-medium text-basalt bg-sandstone rounded px-2 py-1.5 hover:bg-sandstone-light transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewName('') }}
                      className="flex-1 text-xs text-cream/40 hover:text-cream/60 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-cream/50 hover:text-cream hover:bg-cream/5 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
                  </svg>
                  New Project
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
