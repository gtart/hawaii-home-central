'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProjectOptional } from '@/contexts/ProjectContext'
import { ProjectSwitcher } from './ProjectSwitcher'

const LS_KEY = 'hhc_seen_project_banner'

export function ProjectBanner() {
  const projectCtx = useProjectOptional()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(LS_KEY) === '1')
    } catch {
      setDismissed(true)
    }
  }, [])

  if (!projectCtx || projectCtx.isLoading) return null

  const { currentProject } = projectCtx
  const showFirstLoginBanner =
    !dismissed && currentProject?.name === 'My Home'

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* ignore */ }
  }

  if (showFirstLoginBanner) {
    return (
      <div className="bg-basalt-50 rounded-card px-5 py-4 mb-8 border border-cream/10">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-sandstone/15 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-cream/70">
              We created <strong className="text-cream">My Home</strong> as your starter project.
              Rename it anytime.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Link
                href="/app/projects"
                className="text-xs text-sandstone hover:text-sandstone-light font-medium transition-colors"
              >
                Rename
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap bg-basalt-50 rounded-card px-5 py-3.5 mb-8">
      <span className="text-sm text-cream/50">
        {currentProject ? 'You\u2019re working on:' : 'Select a home to get started'}
      </span>
      <ProjectSwitcher />
    </div>
  )
}
