'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'
import { getDashboardStats } from '@/lib/tool-stats'
import { cn } from '@/lib/utils'

interface ToolSummary {
  toolKey: string
  stats?: Record<string, unknown>
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ManageToolsDrawer({ open, onClose }: Props) {
  const { currentProject, setActiveTools } = useProject()
  const activeKeys = currentProject?.activeToolKeys ?? []
  // Empty array = all tools active
  const effectiveKeys = activeKeys.length > 0
    ? new Set(activeKeys)
    : new Set(TOOL_REGISTRY.map((t) => t.toolKey))

  const [selected, setSelected] = useState<Set<string>>(effectiveKeys)
  const [saving, setSaving] = useState(false)
  const [summaries, setSummaries] = useState<Map<string, ToolSummary>>(new Map())

  // Reset selection when drawer opens or project changes
  useEffect(() => {
    if (!open) return
    const keys = (currentProject?.activeToolKeys ?? []).length > 0
      ? new Set(currentProject!.activeToolKeys)
      : new Set(TOOL_REGISTRY.map((t) => t.toolKey))
    setSelected(keys)
  }, [open, currentProject?.id, currentProject?.activeToolKeys])

  // Fetch tool summaries when drawer opens
  useEffect(() => {
    if (!open) return
    fetch('/api/tool-summaries')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.summaries) {
          setSummaries(new Map(
            (data.summaries as ToolSummary[]).map((s) => [s.toolKey, s])
          ))
        }
      })
      .catch(() => {})
  }, [open])

  if (!open) return null

  const isOwner = currentProject?.role === 'OWNER'
  if (!isOwner) return null

  const toggle = (toolKey: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(toolKey)) {
        next.delete(toolKey)
      } else {
        next.add(toolKey)
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const allKeys = TOOL_REGISTRY.map((t) => t.toolKey)
      const allSelected = allKeys.every((k) => selected.has(k))
      // If all selected, store empty array (= all active, backward compat)
      await setActiveTools(allSelected ? [] : Array.from(selected))
      onClose()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-basalt/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-basalt-50 border-l border-cream/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream/10">
          <h2 className="font-serif text-xl text-sandstone">Show / Hide Tools</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-cream/40 hover:text-cream transition-colors rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-cream/50 text-sm mb-5">
            Hide tools you&apos;re not using yet. You can always turn them back on.
          </p>

          <div className="space-y-3">
            {TOOL_REGISTRY.map((tool) => {
              const active = selected.has(tool.toolKey)
              const summary = summaries.get(tool.toolKey)
              const stats = getDashboardStats(tool.toolKey, summary?.stats)
              const statLine = stats.map((s) => `${s.value} ${s.label}`).join(' \u00B7 ')

              return (
                <button
                  key={tool.toolKey}
                  type="button"
                  onClick={() => toggle(tool.toolKey)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-colors',
                    active
                      ? 'border-sandstone/30 bg-sandstone/5'
                      : 'border-cream/10 bg-basalt hover:border-cream/20'
                  )}
                >
                  {/* Toggle indicator */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                      active
                        ? 'border-sandstone bg-sandstone'
                        : 'border-cream/30'
                    )}
                  >
                    {active && (
                      <svg className="w-3 h-3 text-basalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', active ? 'text-cream' : 'text-cream/50')}>
                      {tool.title}
                    </p>
                    <p className="text-xs text-cream/40 mt-0.5">{tool.stage}</p>
                    <p className="text-[11px] text-cream/30 mt-1">
                      {summary ? (statLine || 'In progress') : 'Not started'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-cream/10 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.size === 0}
            className="flex-1 px-4 py-2.5 bg-sandstone text-basalt font-medium text-sm rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-cream/50 text-sm hover:text-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
