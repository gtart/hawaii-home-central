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
    title: 'Bid Checklist',
    description:
      'Compare bids with a simple checklist so missing details are easier to spot.',
    stage: 'Select the Right Pro',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Selections',
    description:
      'Keep your renovation choices organized so finishes, fixtures, and notes stay in one place.',
    stage: 'Choose Your Finishes',
  },
  {
    toolKey: 'punchlist',
    href: '/app/tools/punchlist',
    title: 'Fix List',
    description:
      'Keep a running list of fix items and follow-ups during the build and final walkthrough.',
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
    title: 'Plan & Changes',
    description:
      'Track your scope of work, plan changes, and cost impacts in one place.',
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
