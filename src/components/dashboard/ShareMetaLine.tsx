import type { ToolShareMeta } from '@/server/dashboard'

export function ShareMetaLine({ meta, noun = 'list' }: { meta?: ToolShareMeta; noun?: string }) {
  if (!meta || meta.collectionCount === 0) return null

  const parts: string[] = []
  parts.push(`${meta.collectionCount} ${noun}${meta.collectionCount !== 1 ? 's' : ''}`)
  if (meta.sharedCount > 0) parts.push(`${meta.sharedCount} shared`)
  if (meta.linkEnabledCount > 0) parts.push(`${meta.linkEnabledCount} link${meta.linkEnabledCount !== 1 ? 's' : ''}`)

  return <p className="text-[11px] text-cream/25 mb-1">{parts.join(' · ')}</p>
}
