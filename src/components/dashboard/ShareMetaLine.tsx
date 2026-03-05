import type { ToolShareMeta } from '@/server/dashboard'

export function ShareMetaLine({ meta }: { meta?: ToolShareMeta; noun?: string }) {
  if (!meta || meta.collectionCount === 0) return null

  const parts: string[] = []
  if (meta.sharedCount > 0) parts.push(`${meta.sharedCount} shared`)
  if (meta.linkEnabledCount > 0) parts.push(`${meta.linkEnabledCount} public link${meta.linkEnabledCount !== 1 ? 's' : ''}`)
  if (parts.length === 0) return null

  return <p className="text-[11px] text-cream/25 mb-1">{parts.join(' · ')}</p>
}
