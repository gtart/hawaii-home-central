import heuristicsJson from '@/config/decision_heuristics.v1.json'

// ============================================================================
// TYPES
// ============================================================================

export interface Milestone {
  id: string
  label: string
}

export interface Impact {
  id: string
  label: string
}

export interface HeuristicRule {
  id: string
  match: { any: string[] }
  emits: {
    milestones: string[]
    impacts: string[]
    advice: string[]
  }
}

export interface HeuristicsConfig {
  version: number
  milestones: Milestone[]
  impacts: Impact[]
  rules: HeuristicRule[]
}

export interface MatchResult {
  milestones: Milestone[]
  impacts: Impact[]
  advice: { text: string; key: string }[]
  matchedRuleIds: string[]
}

// ============================================================================
// VALIDATION
// ============================================================================

const DEFAULT_CONFIG: HeuristicsConfig = {
  version: 1,
  milestones: [],
  impacts: [],
  rules: [],
}

function validateHeuristicsConfig(raw: unknown): HeuristicsConfig | null {
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>

  if (typeof obj.version !== 'number') return null
  if (!Array.isArray(obj.milestones)) return null
  if (!Array.isArray(obj.impacts)) return null
  if (!Array.isArray(obj.rules)) return null

  // Validate milestones
  const milestoneIds = new Set<string>()
  for (const m of obj.milestones) {
    if (!m || typeof m !== 'object') return null
    const mile = m as Record<string, unknown>
    if (typeof mile.id !== 'string' || typeof mile.label !== 'string') return null
    if (milestoneIds.has(mile.id)) {
      console.error(`Duplicate milestone ID: ${mile.id}`)
      return null
    }
    milestoneIds.add(mile.id)
  }

  // Validate impacts
  const impactIds = new Set<string>()
  for (const i of obj.impacts) {
    if (!i || typeof i !== 'object') return null
    const imp = i as Record<string, unknown>
    if (typeof imp.id !== 'string' || typeof imp.label !== 'string') return null
    if (impactIds.has(imp.id)) {
      console.error(`Duplicate impact ID: ${imp.id}`)
      return null
    }
    impactIds.add(imp.id)
  }

  // Validate rules
  const ruleIds = new Set<string>()
  for (const r of obj.rules) {
    if (!r || typeof r !== 'object') return null
    const rule = r as Record<string, unknown>
    if (typeof rule.id !== 'string') return null
    if (ruleIds.has(rule.id)) {
      console.error(`Duplicate rule ID: ${rule.id}`)
      return null
    }
    ruleIds.add(rule.id)

    // Validate match
    const match = rule.match as Record<string, unknown> | undefined
    if (!match || !Array.isArray(match.any)) return null
    for (const keyword of match.any) {
      if (typeof keyword !== 'string') return null
    }

    // Validate emits
    const emits = rule.emits as Record<string, unknown> | undefined
    if (!emits) return null
    if (!Array.isArray(emits.milestones) || !Array.isArray(emits.impacts) || !Array.isArray(emits.advice)) return null

    // Validate milestone references
    for (const mId of emits.milestones) {
      if (typeof mId !== 'string' || !milestoneIds.has(mId)) {
        console.error(`Rule "${rule.id}" references unknown milestone: ${mId}`)
        return null
      }
    }

    // Validate impact references
    for (const iId of emits.impacts) {
      if (typeof iId !== 'string' || !impactIds.has(iId)) {
        console.error(`Rule "${rule.id}" references unknown impact: ${iId}`)
        return null
      }
    }

    for (const a of emits.advice) {
      if (typeof a !== 'string') return null
    }
  }

  return raw as HeuristicsConfig
}

// ============================================================================
// CONFIG LOADER
// ============================================================================

let cachedConfig: HeuristicsConfig | null = null

export function getHeuristicsConfig(): HeuristicsConfig {
  if (cachedConfig) return cachedConfig

  const validated = validateHeuristicsConfig(heuristicsJson)
  if (!validated) {
    console.error('Invalid heuristics config — falling back to empty config')
    cachedConfig = DEFAULT_CONFIG
    return DEFAULT_CONFIG
  }

  cachedConfig = validated
  return validated
  // Future: swap to async DB fetch here
  // const raw = await fetchHeuristicsFromDB()
  // return validateHeuristicsConfig(raw) ?? DEFAULT_CONFIG
}

// ============================================================================
// MATCHING ENGINE
// ============================================================================

const MAX_MILESTONES = 3
const MAX_IMPACTS = 4
const MAX_ADVICE = 5

export function matchDecision(
  config: HeuristicsConfig,
  decisionTitle: string,
  roomType: string,
  selectedOptionName?: string,
  dismissedKeys?: string[]
): MatchResult {
  const dismissed = new Set(dismissedKeys || [])

  // Build searchable text from decision context
  const searchText = [decisionTitle, roomType, selectedOptionName || '']
    .join(' ')
    .toLowerCase()

  // Find matching rules
  const matchedRuleIds: string[] = []
  const milestoneIds = new Set<string>()
  const impactIds = new Set<string>()
  const adviceItems: { text: string; key: string }[] = []

  for (const rule of config.rules) {
    const isMatch = rule.match.any.some((keyword) => searchText.includes(keyword.toLowerCase()))
    if (!isMatch) continue

    matchedRuleIds.push(rule.id)

    // Collect milestones
    for (const mId of rule.emits.milestones) {
      const key = `m:${mId}`
      if (!dismissed.has(key)) {
        milestoneIds.add(mId)
      }
    }

    // Collect impacts
    for (const iId of rule.emits.impacts) {
      const key = `i:${iId}`
      if (!dismissed.has(key)) {
        impactIds.add(iId)
      }
    }

    // Collect advice
    for (let i = 0; i < rule.emits.advice.length; i++) {
      const key = `a:${rule.id}:${i}`
      if (!dismissed.has(key)) {
        // Avoid duplicate advice text
        if (!adviceItems.some((a) => a.text === rule.emits.advice[i])) {
          adviceItems.push({ text: rule.emits.advice[i], key })
        }
      }
    }
  }

  // Resolve milestone/impact objects and apply caps
  const milestones = config.milestones
    .filter((m) => milestoneIds.has(m.id))
    .slice(0, MAX_MILESTONES)

  const impacts = config.impacts
    .filter((i) => impactIds.has(i.id))
    .slice(0, MAX_IMPACTS)

  const advice = adviceItems.slice(0, MAX_ADVICE)

  return { milestones, impacts, advice, matchedRuleIds }
}
