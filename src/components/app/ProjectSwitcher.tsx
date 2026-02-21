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
    <div className="relative z-20" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-sandstone/70 hover:text-sandstone transition-colors px-2 py-1 rounded-md hover:bg-sandstone/10 ml-auto"
      >
        <span>Switch</span>
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

            <div className="border-t border-cream/10 mt-1 pt-1">
              <a
                href="/app/projects"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-cream/50 hover:text-cream hover:bg-cream/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Manage my projects
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
