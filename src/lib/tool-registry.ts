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
  /** If true, tool is hidden from user-facing grids/nav but remains in TOOL_LABELS/TOOL_PATHS for backward compat */
  hidden?: boolean
}

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    toolKey: 'mood_boards',
    href: '/app/tools/mood-boards',
    title: 'Mood Boards',
    description:
      'Save and organize inspiration so you can reference it when making decisions.',
    stage: 'Get Inspired',
  },
  {
    toolKey: 'before_you_sign',
    href: '/app/tools/before-you-sign',
    title: 'Contract Checklist',
    description:
      'Compare bids side by side so you know what you\u2019re agreeing to.',
    stage: 'Select the Right Pro',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Choose Selections',
    description:
      'Keep track of every finish and fixture you need to pick\u2014countertops, tile, hardware\u2014so nothing slips through.',
    stage: 'Choose Your Finishes',
  },
  {
    toolKey: 'punchlist',
    href: '/app/tools/punchlist',
    title: 'Fix Issues',
    description:
      'Log every fix and follow up until it\u2019s done. Share the list with your contractor so everyone\u2019s on the same page.',
    stage: 'Build',
  },
  {
    toolKey: 'project_alignment',
    href: '/app/tools/project-alignment',
    title: 'Official Plan',
    description:
      'Track scope questions, mismatches, and agreements between you and your contractor.',
    stage: 'Build',
    hidden: true,
  },
  {
    toolKey: 'project_summary',
    href: '/app/tools/project-summary',
    title: 'Change Log',
    description:
      'Keep a simple record of what changed during your renovation\u2014so nothing gets lost.',
    stage: 'Build',
  },
]

/** Visible (non-hidden) tools for user-facing grids and navigation */
export const VISIBLE_TOOL_REGISTRY = TOOL_REGISTRY.filter((t) => !t.hidden)

/** toolKey → user-facing title (e.g. "Fix List", "Selection Lists") */
export const TOOL_LABELS: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [t.toolKey, t.title]),
)

/** toolKey → app route path (e.g. "/app/tools/punchlist") */
export const TOOL_PATHS: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [t.toolKey, t.href]),
)
