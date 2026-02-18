// ============================================================================
// BYS Payload Types (persisted to DB via useToolState)
// ============================================================================

export type TriStatus = 'yes' | 'no' | 'unknown'

export type TabKey = 'quotes' | 'handoffs' | 'agree'

/** TabKey for checklist tabs, plus 'notes' for the freeform notes view */
export type ViewTab = TabKey | 'notes'

export interface BYSAnswer {
  status: TriStatus
  notes: string
}

export type ContractType = 'fixed' | 'time_materials' | 'cost_plus' | 'not_sure' | ''

export interface BYSContractor {
  id: string
  name: string
  notes: string
  notesUpdatedAt?: string // ISO timestamp of last notes edit
  // Pricing fields (all optional for backward compat)
  totalValue?: string
  allowances?: string
  laborEstimate?: string
  materialsEstimate?: string
  contractType?: ContractType
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
  selectedContractorIds: string[] // array of contractor ids (max 4)
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
