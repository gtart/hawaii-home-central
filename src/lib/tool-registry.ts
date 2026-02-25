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
    title: 'Selections Board',
    description:
      'Keep your renovation moving\u2014by tracking every finish selection, option, and status in one place.',
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
