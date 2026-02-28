'use client'

import { useState } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { ManageToolsDrawer } from './ManageToolsDrawer'

export function ManageToolsButton() {
  const { currentProject } = useProject()
  const [open, setOpen] = useState(false)

  // Only owners can manage tools
  if (currentProject?.role !== 'OWNER') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
      >
        Show / Hide Tools
      </button>
      <ManageToolsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
