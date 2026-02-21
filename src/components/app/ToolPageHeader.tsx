'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { ShareToolModal } from './ShareToolModal'
import { ProjectSwitcher } from './ProjectSwitcher'
import { cn } from '@/lib/utils'

interface Collaborator {
  id: string
  userId: string
  name: string | null
  email: string | null
  image: string | null
  level: 'VIEW' | 'EDIT'
}

interface PendingInvite {
  id: string
  email: string
  level: 'VIEW' | 'EDIT'
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

interface ToolPageHeaderProps {
  toolKey: string
  title: string
  description: string
  /** Actual access level from the tool's API response. */
  accessLevel?: 'OWNER' | 'EDIT' | 'VIEW' | null
  children?: React.ReactNode
}

export function ToolPageHeader({ toolKey, title, description, accessLevel, children }: ToolPageHeaderProps) {
  const { currentProject, projects } = useProject()
  const [showShare, setShowShare] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

  const isOwner = accessLevel === 'OWNER' || currentProject?.role === 'OWNER'
  const hasMultipleProjects = projects.filter((p) => p.status === 'ACTIVE').length >= 2

  const loadCollaborators = useCallback(async () => {
    if (!isOwner || !currentProject?.id) return
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/tools/${toolKey}/share`)
      if (!res.ok) return
      const data = await res.json()
      setCollaborators(data.access ?? [])
      setPendingInvites(
        (data.invites ?? []).map((inv: { id: string; email: string; level: string }) => ({
          id: inv.id,
          email: inv.email,
          level: inv.level as 'VIEW' | 'EDIT',
        }))
      )
    } catch {
      // silent
    }
  }, [isOwner, currentProject?.id, toolKey])

  useEffect(() => {
    loadCollaborators()
  }, [loadCollaborators])

  const handleShareClose = () => {
    setShowShare(false)
    loadCollaborators()
  }

  const totalPeople = collaborators.length + pendingInvites.length

  return (
    <>
      {/* Project banner */}
      {currentProject && (
        <div className="flex items-center gap-3 mb-5 px-4 py-2.5 rounded-lg bg-sandstone/10 border border-sandstone/15">
          <svg className="w-4 h-4 text-sandstone/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-sandstone truncate">{currentProject.name}</span>
          {hasMultipleProjects && <ProjectSwitcher />}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/app"
          className="text-sandstone hover:text-sandstone-light text-sm"
        >
          &larr; My Tools
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
          {title}
        </h1>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          {accessLevel === 'VIEW' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream/10 text-cream/50">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View only
            </span>
          )}
          {accessLevel === 'EDIT' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sandstone/15 text-sandstone">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Can edit
            </span>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone-light transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" />
                <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" />
              </svg>
              {totalPeople > 0 ? 'Manage collaborators' : 'Add a collaborator'}
            </button>
          )}
        </div>
      </div>

      {/* Collaborator pills — each person as an individual pill */}
      {isOwner && totalPeople > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-cream/40 uppercase tracking-wider">Shared with</span>

          {/* Accepted collaborators */}
          {collaborators.map((c) => (
            <div
              key={c.id}
              title={`${c.name || c.email || 'Collaborator'} — ${c.level === 'EDIT' ? 'Can edit' : 'View only'}`}
              className={cn(
                'group relative inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium cursor-default',
                c.level === 'EDIT'
                  ? 'bg-sandstone/15 text-sandstone'
                  : 'bg-cream/10 text-cream/60'
              )}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  width={22}
                  height={22}
                  className="w-[22px] h-[22px] rounded-full object-cover"
                />
              ) : (
                <span className={cn(
                  'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold',
                  c.level === 'EDIT'
                    ? 'bg-sandstone/25 text-sandstone'
                    : 'bg-cream/15 text-cream/50'
                )}>
                  {getInitials(c.name, c.email)}
                </span>
              )}
              <span className="leading-none">{getInitials(c.name, c.email)}</span>

              {/* Hover tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-basalt-50 border border-cream/15 text-xs text-cream whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-10">
                {c.name || c.email}
                <span className="text-cream/40 ml-1">
                  ({c.level === 'EDIT' ? 'Can edit' : 'View only'})
                </span>
              </span>
            </div>
          ))}

          {/* Pending invites */}
          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              title={`${inv.email} — Pending invite (${inv.level === 'EDIT' ? 'Can edit' : 'View only'})`}
              className="group relative inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium bg-cream/5 text-cream/35 border border-dashed border-cream/15 cursor-default"
            >
              <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold bg-cream/8 text-cream/30">
                {inv.email.slice(0, 2).toUpperCase()}
              </span>
              <span className="leading-none">{inv.email.split('@')[0]}</span>

              {/* Hover tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-basalt-50 border border-cream/15 text-xs text-cream whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-10">
                {inv.email}
                <span className="text-cream/40 ml-1">(Pending)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-cream/70 text-lg mb-8 leading-relaxed">
        {description}
      </p>

      {children}

      {showShare && currentProject && (
        <ShareToolModal
          projectId={currentProject.id}
          toolKey={toolKey}
          onClose={handleShareClose}
        />
      )}
    </>
  )
}
