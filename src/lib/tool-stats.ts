export interface DashboardStat {
  label: string
  value: string
}

export function getDashboardStats(toolKey: string, stats?: Record<string, unknown>): DashboardStat[] {
  if (!stats) return []

  if (toolKey === 'before_you_sign') {
    const count = (stats.contractorCount as number | undefined) ?? 0
    return [{ label: 'Contractors', value: String(count) }]
  }
  if (toolKey === 'finish_decisions') {
    const total = (stats.total as number | undefined) ?? 0
    const finalized = (stats.finalized as number | undefined) ?? 0
    const pct = total > 0 ? Math.round((finalized / total) * 100) : 0
    return [
      { label: 'Decisions', value: String(total) },
      { label: 'Finalized', value: `${pct}%` },
    ]
  }
  if (toolKey === 'punchlist') {
    const total = (stats.total as number | undefined) ?? 0
    const done = (stats.done as number | undefined) ?? 0
    return [
      { label: 'Issues', value: String(total) },
      { label: 'Open', value: String(total - done) },
    ]
  }
  if (toolKey === 'mood_boards') {
    const boardCount = (stats.boardCount as number | undefined) ?? 0
    const ideaCount = (stats.ideaCount as number | undefined) ?? 0
    return [
      { label: 'Boards', value: String(boardCount) },
      { label: 'Ideas', value: String(ideaCount) },
    ]
  }
  return []
}

export function isToolEmpty(toolKey: string, stats?: Record<string, unknown>): boolean {
  if (!stats) return true
  if (toolKey === 'mood_boards') return ((stats.ideaCount as number) ?? 0) === 0
  if (toolKey === 'finish_decisions') return ((stats.total as number) ?? 0) === 0
  if (toolKey === 'before_you_sign') return ((stats.contractorCount as number) ?? 0) === 0
  if (toolKey === 'punchlist') return ((stats.total as number) ?? 0) === 0
  return true
}
