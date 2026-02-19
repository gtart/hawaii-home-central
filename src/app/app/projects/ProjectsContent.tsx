'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject, type ProjectInfo } from '@/contexts/ProjectContext'
import { cn } from '@/lib/utils'

type LifecycleSection = 'active' | 'archived' | 'trashed'

export function ProjectsContent() {
  const { projects, currentProject, switchProject, createProject, refreshProjects } = useProject()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE')
  const archivedProjects = projects.filter((p) => p.status === 'ARCHIVED')
  const trashedProjects = projects.filter((p) => p.status === 'TRASHED')

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy('create')
    await createProject(name)
    setNewName('')
    setCreating(false)
    setBusy(null)
  }

  const handleRename = async (projectId: string) => {
    const name = editName.trim()
    if (!name) return
    setBusy(projectId)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      await refreshProjects()
    } catch {
      // silent
    }
    setEditingId(null)
    setEditName('')
    setBusy(null)
  }

  const handleStatusChange = async (projectId: string, status: string) => {
    setBusy(projectId)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await refreshProjects()
    } catch {
      // silent
    }
    setBusy(null)
  }

  const handlePermanentDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Permanently delete "${projectName}"? This cannot be undone.`)) return
    setBusy(projectId)
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      await refreshProjects()
    } catch {
      // silent
    }
    setBusy(null)
  }

  const renderProjectRow = (project: ProjectInfo, section: LifecycleSection) => {
    const isCurrent = project.id === currentProject?.id
    const isEditing = editingId === project.id
    const isBusy = busy === project.id
    const isOwner = project.role === 'OWNER'

    return (
      <div
        key={project.id}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isCurrent ? 'bg-sandstone/5 border border-sandstone/20' : 'bg-basalt-50'
        )}
      >
        {/* Name / edit */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(project.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 bg-basalt border border-cream/20 rounded px-2.5 py-1 text-sm text-cream focus:outline-none focus:border-sandstone/50"
              />
              <button
                type="button"
                onClick={() => handleRename(project.id)}
                className="text-xs font-medium text-basalt bg-sandstone rounded px-2.5 py-1 hover:bg-sandstone-light transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs text-cream/40 hover:text-cream/60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-cream truncate">{project.name}</span>
              {isCurrent && (
                <span className="text-[10px] text-sandstone bg-sandstone/10 px-1.5 py-0.5 rounded-full">
                  Current
                </span>
              )}
              {project.role === 'MEMBER' && (
                <span className="text-[10px] text-cream/30 bg-cream/5 px-1.5 py-0.5 rounded-full">
                  Shared
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            {section === 'active' && (
              <>
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => switchProject(project.id)}
                    disabled={isBusy}
                    className="text-xs text-cream/40 hover:text-cream px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                  >
                    Switch to
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingId(project.id); setEditName(project.name) }}
                  className="text-xs text-cream/40 hover:text-cream px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(project.id, 'ARCHIVED')}
                  disabled={isBusy}
                  className="text-xs text-cream/40 hover:text-amber-400 px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Archive
                </button>
              </>
            )}
            {section === 'archived' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange(project.id, 'ACTIVE')}
                  disabled={isBusy}
                  className="text-xs text-cream/40 hover:text-cream px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(project.id, 'TRASHED')}
                  disabled={isBusy}
                  className="text-xs text-cream/40 hover:text-red-400 px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Trash
                </button>
              </>
            )}
            {section === 'trashed' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange(project.id, 'ACTIVE')}
                  disabled={isBusy}
                  className="text-xs text-cream/40 hover:text-cream px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(project.id, project.name)}
                  disabled={isBusy}
                  className="text-xs text-cream/40 hover:text-red-400 px-2 py-1 rounded hover:bg-cream/5 transition-colors"
                >
                  Delete forever
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        <Link
          href="/app/settings"
          className="text-sandstone hover:text-sandstone-light text-sm mb-4 inline-block"
        >
          &larr; Settings
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-8">
          Projects
        </h1>

        {/* Active */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-cream/60 uppercase tracking-wider">
              Active ({activeProjects.length})
            </h2>
            {!creating && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
              >
                + New project
              </button>
            )}
          </div>

          <div className="space-y-2">
            {activeProjects.map((p) => renderProjectRow(p, 'active'))}

            {creating && (
              <div className="bg-basalt-50 rounded-lg px-4 py-3">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') { setCreating(false); setNewName('') }
                  }}
                  placeholder="Project name..."
                  className="w-full bg-basalt border border-cream/20 rounded px-2.5 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={busy === 'create'}
                    className="text-xs font-medium text-basalt bg-sandstone rounded px-3 py-1.5 hover:bg-sandstone-light transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName('') }}
                    className="text-xs text-cream/40 hover:text-cream/60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Archived */}
        {archivedProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-cream/40 uppercase tracking-wider mb-3">
              Archived ({archivedProjects.length})
            </h2>
            <div className="space-y-2">
              {archivedProjects.map((p) => renderProjectRow(p, 'archived'))}
            </div>
          </div>
        )}

        {/* Trashed */}
        {trashedProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-red-400/60 uppercase tracking-wider mb-3">
              Trash ({trashedProjects.length})
            </h2>
            <p className="text-xs text-cream/30 mb-3">
              Trashed projects can be restored or permanently deleted.
            </p>
            <div className="space-y-2">
              {trashedProjects.map((p) => renderProjectRow(p, 'trashed'))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
