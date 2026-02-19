'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { ShareToolModal } from './ShareToolModal'

interface ToolPageHeaderProps {
  toolKey: string
  title: string
  description: string
  children?: React.ReactNode
}

export function ToolPageHeader({ toolKey, title, description, children }: ToolPageHeaderProps) {
  const { currentProject } = useProject()
  const [showShare, setShowShare] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'OWNER' | 'EDIT' | 'VIEW' | null>(null)

  const isOwner = currentProject?.role === 'OWNER'

  // Determine access level for non-owners
  useEffect(() => {
    if (!currentProject) return
    if (isOwner) {
      setAccessLevel('OWNER')
      return
    }
    // For members, check their access level via the share API
    // Simple approach: just show VIEW badge for MEMBER role
    // The actual enforcement happens server-side
    setAccessLevel(currentProject.role === 'MEMBER' ? 'VIEW' : null)
  }, [currentProject, isOwner])

  return (
    <>
      <Link
        href="/app"
        className="text-sandstone hover:text-sandstone-light text-sm mb-4 inline-block"
      >
        &larr; My Tools
      </Link>

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
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-cream/60 hover:text-cream hover:bg-cream/5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
              </svg>
              Share
            </button>
          )}
        </div>
      </div>

      <p className="text-cream/70 text-lg mb-8 leading-relaxed">
        {description}
      </p>

      {children}

      {showShare && currentProject && (
        <ShareToolModal
          projectId={currentProject.id}
          toolKey={toolKey}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  )
}
