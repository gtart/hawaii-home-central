'use client'

import { Card } from '@/components/ui/Card'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

export function ToolGrid() {
  const { currentProject } = useProject()

  // Owners see all tools. Members only see tools they have access to.
  const visibleTools = currentProject?.role === 'MEMBER' && currentProject.toolAccess
    ? TOOL_REGISTRY.filter((t) =>
        currentProject.toolAccess!.some((a) => a.toolKey === t.toolKey)
      )
    : TOOL_REGISTRY

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
