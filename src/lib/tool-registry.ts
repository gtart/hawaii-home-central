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
      'Walk through each bid with the same checklist\u2014so nothing gets missed before you sign.',
    stage: 'Find a Pro',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Finish Selections',
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
