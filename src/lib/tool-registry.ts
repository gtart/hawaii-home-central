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
    title: 'Decision Tracker',
    description:
      'Keep your renovation moving\u2014by tracking every finish decision, option, and status in one place.',
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
]
