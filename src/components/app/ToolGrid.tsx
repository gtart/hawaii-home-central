'use client'

import { Card } from '@/components/ui/Card'
import { useProject } from '@/contexts/ProjectContext'

const ALL_TOOLS = [
  {
    toolKey: 'before_you_sign',
    href: '/app/tools/before-you-sign',
    title: 'Contract Comparison Tool',
    description: 'Compare quotes, assign who handles what, and agree on the details that cause fights later.',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Decision Tracker',
    description: 'Track every material and finish decision by room. Compare options, record specs and links, and mark progress from deciding to done.',
  },
]

export function ToolGrid() {
  const { currentProject } = useProject()

  // Owners see all tools. Members only see tools they have access to.
  const visibleTools = currentProject?.role === 'MEMBER' && currentProject.toolAccess
    ? ALL_TOOLS.filter((t) =>
        currentProject.toolAccess!.some((a) => a.toolKey === t.toolKey)
      )
    : ALL_TOOLS

  if (visibleTools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-cream/40 text-sm">
          No tools have been shared with you for this project yet.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {visibleTools.map((tool) => (
        <Card
          key={tool.toolKey}
          href={tool.href}
          title={tool.title}
          description={tool.description}
          badge="Live"
        />
      ))}
    </div>
  )
}
