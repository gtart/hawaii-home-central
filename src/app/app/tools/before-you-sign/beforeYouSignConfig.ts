import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'
import { RESPONSIBILITY_ITEMS, STAGES } from '@/data/responsibility-matrix'
import type { BYSTabConfig, BYSConfigItem, BYSConfigSection, TabKey } from './types'

// ============================================================================
// Shortened label maps
// ============================================================================

const QUOTES_SHORT_LABELS: Record<string, string> = {
  // Scope & Documents
  'scope-written-description': 'Written scope of work',
  'scope-plans-referenced': 'Plans referenced & attached',
  'scope-specs-included': 'Finish specs listed',
  'scope-demo-included': 'Demo scope defined',
  // Labor Breakdown
  'labor-trades-listed': 'Trades & subs identified',
  'labor-rates-transparent': 'Labor costs broken out',
  'labor-supervision': 'Supervision included',
  'labor-licensing': 'Contractor license verified',
  // Materials & Specifications
  'materials-brand-model': 'Brands & models specified',
  'materials-grade-quality': 'Grade / quality level noted',
  'materials-procurement': 'Who buys materials',
  'materials-durability': 'Materials suit local conditions',
  // Allowances
  'allowances-identified': 'Allowances with $ amounts',
  'allowances-realistic': 'Allowance amounts realistic',
  'allowances-overage': 'Overage handling stated',
  'allowances-installation': 'Install included in allowance',
  // Permits & Inspections
  'permits-included': 'Permit costs included',
  'permits-who-pulls': 'Who pulls permits',
  'permits-inspections-scheduled': 'Inspections in timeline',
  'permits-code-compliance': 'Current code referenced',
  // Timeline & Sequencing
  'timeline-start-date': 'Start & completion dates',
  'timeline-milestones': 'Milestones / phases outlined',
  'timeline-lead-times': 'Lead times in schedule',
  'timeline-delays': 'Delay handling defined',
  // Change Orders
  'change-process': 'Change order process',
  'change-markup': 'Change order markup',
  'change-written-approval': 'Written CO approval required',
  // Exclusions & Assumptions
  'exclusions-listed': 'Exclusions listed',
  'exclusions-assumptions': 'Assumptions stated',
  'exclusions-hazmat': 'Hazmat abatement addressed',
  'exclusions-structural': 'Structural surprises noted',
  // Site Conditions & Contingencies
  'site-access': 'Site access constraints',
  'site-protection': 'Site protection & cleanup',
  'site-contingency': 'Contingency budget',
  'site-utilities': 'Temporary utilities',
  // Payment Terms
  'payment-schedule': 'Milestone-based payments',
  'payment-deposit': 'Reasonable deposit',
  'payment-retainage': 'Final holdback / retainage',
  'payment-methods': 'Payment methods & invoicing',
  // Warranty & Punch List
  'warranty-workmanship': 'Workmanship warranty',
  'warranty-materials': 'Material warranties passed through',
  'warranty-punchlist-process': 'Punch list process',
  'warranty-callback': 'Warranty callback process',
}

const HANDOFFS_SHORT_LABELS: Record<string, string> = {
  'permits-inspections': 'Permits & inspections',
  'allowances-selections': 'Allowances & selections',
  'buying-long-lead': 'Long-lead ordering',
  'delivery-scheduling': 'Delivery scheduling',
  'storage-protection': 'Storage & protection',
  'damage-defects-returns': 'Damage / defects / returns',
  'cabinet-appliance-integration': 'Cabinet-appliance fit',
  'plumbing-rough-in': 'Plumbing rough-in',
  'electrical-fixture-locations': 'Electrical fixture placement',
  'site-protection-dust': 'Site protection & dust',
  'backing-blocking': 'Backing & blocking',
  'waterproofing-warranty': 'Waterproofing system',
  'tile-layout-grout': 'Tile layout & grout',
  'shower-glass-template': 'Shower glass measurement',
  'patch-paint-finish': 'Patch / paint at scope edges',
  'warranty-boundaries': 'Warranty boundaries',
}

// ============================================================================
// Build tab configs from existing data
// ============================================================================

export const QUOTES_CONFIG: BYSTabConfig = {
  key: 'quotes',
  label: 'Compare Quotes',
  sections: CHECKLIST_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      shortLabel: QUOTES_SHORT_LABELS[item.id] ?? item.label,
      fullLabel: item.label,
      detail: item.detail,
      priority: item.priority,
      hawaiiCallout: item.hawaiiCallout,
    })),
  })),
}

export const HANDOFFS_CONFIG: BYSTabConfig = {
  key: 'handoffs',
  label: 'Who Handles What',
  sections: STAGES.map((stage) => {
    const stageItems = RESPONSIBILITY_ITEMS.filter((item) => item.stage === stage)
    return {
      id: stage.toLowerCase().replace(/\s+\/?\s*/g, '-'),
      title: stage,
      items: stageItems.map((item) => ({
        id: item.id,
        shortLabel: HANDOFFS_SHORT_LABELS[item.id] ?? item.category,
        fullLabel: item.clarifyQuestion,
        detail: item.commonMismatch,
        variance: item.variance,
        oftenOwner: item.oftenOwner,
        stage: item.stage,
        includes: item.includes,
        commonMismatch: item.commonMismatch,
      })),
    }
  }),
}

const DEFAULT_AGREE_ITEMS: BYSConfigItem[] = [
  {
    id: 'change_orders',
    shortLabel: 'Change order pricing',
    fullLabel: 'How will changes be priced and approved?',
    detail:
      'Changes are inevitable. Agree on the process (written approval, markup %) before work starts so surprises don\u2019t become disputes.',
  },
  {
    id: 'payment_timing',
    shortLabel: 'Payment timing',
    fullLabel: 'When is payment due, and for what?',
    detail:
      'Milestone-based payments protect both sides. Avoid front-loaded schedules. A 5\u201310% retainage until punch list is complete is standard.',
  },
  {
    id: 'allowances',
    shortLabel: 'Out-of-stock / over allowance',
    fullLabel: 'What happens if something is out of stock or over allowance?',
    detail:
      'Allowances are budget placeholders. Agree on how overages are handled\u2014straight pass-through or markup\u2014and what happens with credits.',
  },
  {
    id: 'communication',
    shortLabel: 'Communication plan',
    fullLabel: 'How will you communicate, and how often?',
    detail:
      'Agree on the channel (text, email, app), frequency (weekly updates?), and who the single point of contact is for day-to-day questions.',
  },
]

export const AGREE_CONFIG: BYSTabConfig = {
  key: 'agree',
  label: 'Key Agreements',
  sections: [
    {
      id: 'things-to-agree-on',
      title: 'Things to Agree On',
      items: DEFAULT_AGREE_ITEMS,
    },
  ],
}

export const ALL_TABS: BYSTabConfig[] = [QUOTES_CONFIG, HANDOFFS_CONFIG, AGREE_CONFIG]

// ============================================================================
// Helpers
// ============================================================================

const itemIndex = new Map<string, BYSConfigItem>()
for (const tab of ALL_TABS) {
  for (const section of tab.sections) {
    for (const item of section.items) {
      itemIndex.set(item.id, item)
    }
  }
}

export function getItemConfig(itemId: string): BYSConfigItem | undefined {
  return itemIndex.get(itemId)
}

export function getTabItemIds(tab: TabKey): string[] {
  const config = ALL_TABS.find((t) => t.key === tab)
  if (!config) return []
  return config.sections.flatMap((s) => s.items.map((i) => i.id))
}
