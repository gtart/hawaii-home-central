import type { DashboardResponse, ToolKey, ToolShareMeta } from '@/server/dashboard'

export type { ToolKey }

export interface ScoredTool {
  toolKey: ToolKey
  score: number
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

const EMPTY_META: ToolShareMeta = {
  collectionCount: 0,
  sharedCount: 0,
  linkEnabledCount: 0,
  pendingInvitesCount: 0,
  lastUpdatedAt: null,
}

function getMeta(data: DashboardResponse, tk: ToolKey): ToolShareMeta {
  return data.toolMeta?.[tk] ?? EMPTY_META
}

function isActionable(tk: ToolKey, data: DashboardResponse): boolean {
  switch (tk) {
    case 'punchlist':
      return data.fixLists.some((l) => l.openCount > 0)
    case 'finish_decisions':
      return data.selectionLists.some((l) => l.notStartedCount > 0 || l.decidingCount > 0)
    case 'mood_boards':
      return data.moodBoards.length > 0
    case 'before_you_sign':
      return data.beforeYouSign.some((c) => c.contractorCount > 0)
    default:
      return false
  }
}

export function scoreTool(tk: ToolKey, data: DashboardResponse): number {
  const meta = getMeta(data, tk)
  let score = 0
  if (isActionable(tk, data)) score += 100
  if (meta.collectionCount > 0) score += 50
  if (meta.lastUpdatedAt && Date.now() - new Date(meta.lastUpdatedAt).getTime() <= FOURTEEN_DAYS_MS) score += 20
  if (meta.sharedCount > 0) score += 10
  return score
}

export function rankTools(data: DashboardResponse): { active: ScoredTool[]; other: ScoredTool[] } {
  const toolKeys: ToolKey[] = ['punchlist', 'finish_decisions', 'mood_boards', 'before_you_sign']
  const scored = toolKeys.map((tk) => ({ toolKey: tk, score: scoreTool(tk, data) }))
  scored.sort((a, b) => b.score - a.score)

  const active = scored.filter((t) => t.score > 0).slice(0, 4)
  const other = scored.filter((t) => !active.includes(t))

  if (active.length === 0) return { active: scored, other: [] }
  return { active, other }
}
