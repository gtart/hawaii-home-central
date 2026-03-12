/**
 * Single source of truth for all tool metadata.
 * Used by ToolGrid and potentially tool pages.
 */

export interface ToolRegistryEntry {
  toolKey: string
  href: string
  title: string
  description: string
  /** Which renovation stage this tool belongs to */
  stage: string
}

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    toolKey: 'mood_boards',
    href: '/app/tools/mood-boards',
    title: 'Mood Boards',
    description:
      'Collect and organize inspiration from anywhere\u2014then turn your favorites into real decisions.',
    stage: 'Get Inspired',
  },
  {
    toolKey: 'before_you_sign',
    href: '/app/tools/before-you-sign',
    title: 'Contract Checklist',
    description:
      'Compare contractors and bids using the same criteria\u2014so nothing gets missed.',
    stage: 'Select the Right Pro',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Selections',
    description:
      'Track the choices you need to make\u2014tile, countertops, hardware\u2014and what you picked.',
    stage: 'Choose Your Finishes',
  },
  {
    toolKey: 'punchlist',
    href: '/app/tools/punchlist',
    title: 'Fix List',
    description:
      'Track fixes and share with your contractor.',
    stage: 'Build',
  },
  {
    toolKey: 'project_alignment',
    href: '/app/tools/project-alignment',
    title: 'Project Alignment',
    description:
      'Track scope questions, mismatches, and agreements between you and your contractor.',
    stage: 'Build',
  },
  {
    toolKey: 'project_summary',
    href: '/app/tools/project-summary',
    title: 'Project Summary',
    description:
      'A quick snapshot of your project: what\'s included, what\'s changed, and what still needs a decision.',
    stage: 'Build',
  },
]

/** toolKey → user-facing title (e.g. "Fix List", "Selection Lists") */
export const TOOL_LABELS: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [t.toolKey, t.title]),
)

/** toolKey → app route path (e.g. "/app/tools/punchlist") */
export const TOOL_PATHS: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [t.toolKey, t.href]),
)
