'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'
import { getToolPriority, getStageLabel } from '@/lib/stage-tool-priority'
import { OnboardingModal } from './OnboardingModal'

interface ToolSummary {
  toolKey: string
  stats?: Record<string, unknown>
}

/** Maps toolKey → user-friendly CTA label */
const CTA_LABELS: Record<string, string> = {
  mood_boards: 'Save your first idea',
  finish_decisions: 'Add your first room',
  before_you_sign: 'Start your contractor checklist',
  punchlist: 'Track your first fix',
}

function isToolEmpty(toolKey: string, stats?: Record<string, unknown>): boolean {
  if (!stats) return true
  if (toolKey === 'mood_boards') return ((stats.ideaCount as number) ?? 0) === 0
  if (toolKey === 'finish_decisions') return ((stats.total as number) ?? 0) === 0
  if (toolKey === 'before_you_sign') return ((stats.contractorCount as number) ?? 0) === 0
  if (toolKey === 'punchlist') return ((stats.total as number) ?? 0) === 0
  return true
}

export function NextStepsCard() {
  const { currentProject } = useProject()
  const [emptyTools, setEmptyTools] = useState<typeof TOOL_REGISTRY>([])
  const [loaded, setLoaded] = useState(false)
  const [showStagePicker, setShowStagePicker] = useState(false)

  const stageId = currentProject?.currentStage ?? null
  const stageLabel = getStageLabel(stageId)

  const sortByStage = useCallback(
    (tools: typeof TOOL_REGISTRY) => {
      const priority = getToolPriority(stageId)
      if (!priority) return tools
      return [...tools].sort((a, b) => {
        const ai = priority.indexOf(a.toolKey)
        const bi = priority.indexOf(b.toolKey)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
    },
    [stageId]
  )

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    fetch('/api/tool-summaries')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const summaries: ToolSummary[] = data?.summaries ?? []
        const summaryMap = new Map(summaries.map((s) => [s.toolKey, s]))

        const empty = TOOL_REGISTRY.filter((tool) => {
          const summary = summaryMap.get(tool.toolKey)
          return isToolEmpty(tool.toolKey, summary?.stats)
        })

        setEmptyTools(sortByStage(empty))
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true)
      })

    return () => { cancelled = true }
  }, [currentProject?.id, sortByStage])

  // Don't show anything until loaded, and hide entirely if all tools have data
  if (!loaded || emptyTools.length === 0) return null

  const [primary, ...secondary] = emptyTools

  return (
    <>
      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="font-serif text-xl text-sandstone">Next Steps</h2>
          {stageLabel && (
            <button
              type="button"
              onClick={() => setShowStagePicker(true)}
              className="text-xs text-cream/40 hover:text-cream/70 transition-colors shrink-0"
            >
              {stageLabel} &middot; Change
            </button>
          )}
        </div>
        <p className="text-cream/50 text-sm mb-5">
          {stageLabel
            ? `Recommended for the ${stageLabel.toLowerCase()} stage.`
            : "Here's what to try next based on where you are."}
        </p>

        <Link
          href={primary.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sandstone text-basalt font-medium text-sm rounded-lg hover:bg-sandstone-light transition-colors"
        >
          {CTA_LABELS[primary.toolKey] ?? `Open ${primary.title}`}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {secondary.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            {secondary.map((tool) => (
              <Link
                key={tool.toolKey}
                href={tool.href}
                className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
              >
                {CTA_LABELS[tool.toolKey] ?? tool.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      {showStagePicker && (
        <OnboardingModal onClose={() => setShowStagePicker(false)} />
      )}
    </>
  )
}
