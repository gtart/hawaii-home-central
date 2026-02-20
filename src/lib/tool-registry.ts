/**
 * Single source of truth for all tool metadata.
 * Used by ToolGrid and potentially tool pages.
 */

export interface ToolRegistryEntry {
  toolKey: string
  href: string
  title: string
  description: string
}

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    toolKey: 'before_you_sign',
    href: '/app/tools/before-you-sign',
    title: 'Contract Comparison Tool',
    description:
      'Make bids more comparable\u2014so you can choose confidently and avoid surprise scope gaps later.',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Decision Tracker',
    description:
      'Keep your renovation moving\u2014by tracking every finish decision, option, and status in one place.',
  },
]
