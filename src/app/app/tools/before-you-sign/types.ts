// ============================================================================
// BYS Payload Types (persisted to DB via useToolState)
// ============================================================================

export type TriStatus = 'yes' | 'no' | 'unknown'

export type TabKey = 'quotes' | 'handoffs' | 'agree'

export interface BYSAnswer {
  status: TriStatus
  notes: string
}

export interface BYSContractor {
  id: string
  name: string
  notes: string
}

export interface BYSCustomAgreeItem {
  id: string
  question: string
}

/** answers[tabKey][contractorId][itemId] = { status, notes } */
export type BYSAnswers = Record<
  TabKey,
  Record<string, Record<string, BYSAnswer>>
>

export interface BYSPayload {
  version: 1
  contractors: BYSContractor[]
  activeContractorId: string // 'all' | contractor id
  answers: BYSAnswers
  customAgreeItems: BYSCustomAgreeItem[]
}

// ============================================================================
// Config types (code-defined items, not persisted)
// ============================================================================

export interface BYSConfigItem {
  id: string
  shortLabel: string
  fullLabel: string
  detail: string
  priority?: 'essential' | 'nice-to-know'
  hawaiiCallout?: string
  variance?: 'high' | 'normal'
  oftenOwner?: string
  stage?: string
  includes?: string[]
  commonMismatch?: string
}

export interface BYSConfigSection {
  id: string
  title: string
  items: BYSConfigItem[]
}

export interface BYSTabConfig {
  key: TabKey
  label: string
  sections: BYSConfigSection[]
}
