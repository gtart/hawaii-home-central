export type OwnerOption =
  | 'Homeowner'
  | 'GC / Contractor'
  | 'Trade / Sub'
  | 'Vendor / Supplier'
  | 'Shared'
  | 'Other / TBD'

export const OWNER_OPTIONS: OwnerOption[] = [
  'Homeowner',
  'GC / Contractor',
  'Trade / Sub',
  'Vendor / Supplier',
  'Shared',
  'Other / TBD',
]

export type ResponsibilityStage =
  | 'Ordering'
  | 'Rough-In'
  | 'Close Walls'
  | 'Waterproof / Tile'
  | 'Closeout'

export const STAGES: ResponsibilityStage[] = [
  'Ordering',
  'Rough-In',
  'Close Walls',
  'Waterproof / Tile',
  'Closeout',
]

export interface ResponsibilityItemData {
  id: string
  category: string
  variance: 'high' | 'normal'
  oftenOwner: OwnerOption
  stage: ResponsibilityStage
  includes: string[]
  clarifyQuestion: string
  commonMismatch: string
}

export const RESPONSIBILITY_ITEMS: ResponsibilityItemData[] = [
  {
    id: 'permits-inspections',
    category: 'Permits & Inspections',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Ordering',
    includes: [
      'Pulling permits',
      'Paying fees',
      'Scheduling inspections',
      'Handling corrections',
    ],
    clarifyQuestion:
      'Who pulls permits, pays fees, schedules inspections, and handles corrections start-to-finish?',
    commonMismatch:
      'Some bids exclude permit fees or assume the homeowner schedules inspections.',
  },
  {
    id: 'allowances-selections',
    category: 'Allowances & Finish Decisions',
    variance: 'high',
    oftenOwner: 'Shared',
    stage: 'Ordering',
    includes: [
      'Allowance definitions',
      'Overage handling',
      'Markup / admin fees',
      'Selection deadlines',
    ],
    clarifyQuestion:
      'What exactly is included in each allowance (tax/freight/labor), and what happens if we exceed it?',
    commonMismatch:
      'Homeowners assume allowance covers install; contractor prices install separately.',
  },
  {
    id: 'buying-long-lead',
    category: 'Buying & Ordering Long-Lead Items',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Ordering',
    includes: [
      'Placing orders',
      'Verifying specs',
      'Tracking lead times',
    ],
    clarifyQuestion:
      'Who orders windows/cabinets/appliances, verifies specs, and tracks lead times?',
    commonMismatch:
      'Homeowner buys items, but contractor expects to control ordering to avoid wrong specs.',
  },
  {
    id: 'delivery-scheduling',
    category: 'Delivery Scheduling',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Ordering',
    includes: [
      'Coordinating delivery windows',
      'Site readiness',
      'Re-delivery fees',
    ],
    clarifyQuestion:
      'Who schedules deliveries and confirms the site is ready to receive them?',
    commonMismatch:
      'Deliveries show up before site readiness, causing fees and damage risk.',
  },
  {
    id: 'storage-protection',
    category: 'Storage & Protection of Owner-Purchased Items',
    variance: 'high',
    oftenOwner: 'Homeowner',
    stage: 'Ordering',
    includes: [
      'Secure storage',
      'Damage / theft responsibility',
      'Climate considerations',
    ],
    clarifyQuestion:
      "If we buy fixtures/tile ourselves, who stores them and who's responsible if they're damaged?",
    commonMismatch:
      'Items sit on-site unprotected and get damaged; nobody claims responsibility.',
  },
  {
    id: 'damage-defects-returns',
    category: 'Damage / Defects / Returns',
    variance: 'high',
    oftenOwner: 'Shared',
    stage: 'Ordering',
    includes: [
      'Inspecting on arrival',
      'Return process',
      'Who pays restocking / shipping',
    ],
    clarifyQuestion:
      'Who inspects items on arrival and who handles defects/returns and associated fees?',
    commonMismatch:
      'Contractor installs a defective item, then replacement causes schedule slip and change order.',
  },
  {
    id: 'cabinet-appliance-integration',
    category: 'Cabinet-Appliance Integration',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Rough-In',
    includes: [
      'Appliance cut sheets',
      'Panel-ready requirements',
      'Clearances',
    ],
    clarifyQuestion:
      'Who ensures appliance models and cut sheets are integrated into cabinet design before ordering?',
    commonMismatch:
      "Cabinets arrive and appliances don't fit, causing rework and delays.",
  },
  {
    id: 'plumbing-rough-in',
    category: 'Plumbing Rough-In Responsibility',
    variance: 'normal',
    oftenOwner: 'Trade / Sub',
    stage: 'Rough-In',
    includes: [
      'Exact valve locations',
      'Wall depth needs',
      'Code compliance',
    ],
    clarifyQuestion:
      'Who confirms rough-in heights/depths for our chosen fixtures (especially wall-mount faucets/valves)?',
    commonMismatch:
      'Fixtures selected late force rough-in changes after walls are closed.',
  },
  {
    id: 'electrical-fixture-locations',
    category: 'Electrical Fixture Locations',
    variance: 'normal',
    oftenOwner: 'Trade / Sub',
    stage: 'Rough-In',
    includes: [
      'Box placement',
      'Dimming compatibility',
      'Drivers / transformers',
    ],
    clarifyQuestion:
      'Who confirms exact light locations and compatibility (dimmers, drivers, under-cabinet lighting) before rough-in?',
    commonMismatch:
      'Lighting plan changes after rough-in lead to patchwork and added cost.',
  },
  {
    id: 'site-protection-dust',
    category: 'Site Protection & Dust Control',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Close Walls',
    includes: [
      'Floor protection',
      'Dust barriers',
      'Daily cleanup',
      'Dumpster / disposal',
    ],
    clarifyQuestion:
      'What site protection and cleanup is included daily, and what’s excluded (dumpster, hauling, disposal fees)?',
    commonMismatch:
      'Homeowners assume full protection; bid includes minimal protection.',
  },
  {
    id: 'backing-blocking',
    category: 'Backing & Blocking for Wall-Hung Items',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Close Walls',
    includes: [
      'Grab bar blocking',
      'Heavy mirror / TV mount backing',
      'Wall-hung vanity support',
      'Accessory mounting points',
    ],
    clarifyQuestion:
      'Who specifies where blocking is needed, and who verifies it is installed before walls close?',
    commonMismatch:
      'Blocking is omitted because nobody specified accessories early enough; adding it later means opening finished walls.',
  },
  {
    id: 'waterproofing-warranty',
    category: 'Waterproofing System & Warranty',
    variance: 'high',
    oftenOwner: 'Trade / Sub',
    stage: 'Waterproof / Tile',
    includes: [
      'Membrane / system selection',
      'Warranty ownership and registration',
      'Inspection before tile',
    ],
    clarifyQuestion:
      'Who selects the waterproofing system, who warranties it, and is there an inspection before tile goes on?',
    commonMismatch:
      'Homeowner assumes lifetime warranty; it may only cover materials, not labor to fix a leak.',
  },
  {
    id: 'tile-layout-grout',
    category: 'Tile Layout, Edges & Grout',
    variance: 'high',
    oftenOwner: 'Shared',
    stage: 'Waterproof / Tile',
    includes: [
      'Layout starting point and centering',
      'Edge trim / bullnose selection',
      'Grout width and color',
      'Pattern alignment across surfaces',
    ],
    clarifyQuestion:
      'Who approves the tile layout on-site before installation begins, and who selects edge trim and grout?',
    commonMismatch:
      'No layout approval happens; tile is installed off-center or with inconsistent cuts at edges.',
  },
  {
    id: 'shower-glass-template',
    category: 'Shower Glass Measurement & Template',
    variance: 'high',
    oftenOwner: 'Trade / Sub',
    stage: 'Waterproof / Tile',
    includes: [
      'Template timing after tile',
      'Measurement handoff to glass vendor',
      'Lead time coordination',
    ],
    clarifyQuestion:
      'Who coordinates the glass template timing, and who ensures measurements happen after tile is complete?',
    commonMismatch:
      'Glass ordered before tile is done; dimensions don’t match finished walls, causing reorder and delay.',
  },
  {
    id: 'patch-paint-finish',
    category: 'Patch / Paint / Finish Repair at Scope Edges',
    variance: 'high',
    oftenOwner: 'Shared',
    stage: 'Closeout',
    includes: [
      'Drywall patching',
      'Paint matching',
      'Trim returns',
      'Touch-ups',
    ],
    clarifyQuestion:
      'Who is responsible for patch/paint and finish repairs where scopes meet (plumbing/electrical/tile/cabinets)?',
    commonMismatch:
      "Each trade says it's someone else's job; homeowner pays extra at the end.",
  },
  {
    id: 'warranty-boundaries',
    category: 'Warranty Boundaries',
    variance: 'high',
    oftenOwner: 'GC / Contractor',
    stage: 'Closeout',
    includes: [
      'Labor vs materials warranty',
      'Manufacturer claims process',
    ],
    clarifyQuestion:
      'What’s covered under labor warranty vs manufacturer warranty, and who handles claims?',
    commonMismatch:
      'When something fails, everyone points to someone else.',
  },
]
