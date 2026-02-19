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
      'Compare quotes, assign who handles what, and agree on the details that cause fights later.',
  },
  {
    toolKey: 'finish_decisions',
    href: '/app/tools/finish-decisions',
    title: 'Decision Tracker',
    description:
      'Track every material and finish decision by room. Compare options, record specs and links, and mark progress from deciding to done.',
  },
]
