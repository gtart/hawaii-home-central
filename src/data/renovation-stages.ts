export interface RelatedLink {
  kind: 'tool' | 'guide'
  title: string
  href: string
}

export interface RenovationStage {
  id: string
  number: number
  title: string
  subtitle: string
  previewLine: string
  whatHappens: string
  decisions: string[]
  hawaiiNotes: string[]
  pitfalls: string[]
  related?: RelatedLink[]
}

export const BUILD_SUBSTEPS = [
  'Demo & Remove Old Stuff',
  'Fix or Change What\u2019s Behind the Walls (framing, etc.)',
  'Run Rough-Ins for Electrical, Plumbing, A/C',
  'Inspections',
  'Close the Walls (insulation, drywall, etc.)',
]

export const FINISH_SUBSTEPS = [
  'Waterproofing',
  'Tile',
  'Flooring',
  'Cabinets',
  'Plumbing & Electric Fixtures',
  'Paint & Final Fixtures',
]

export const RENOVATION_STAGES: RenovationStage[] = [
  {
    id: 'plan',
    number: 1,
    title: 'Plan',
    subtitle: 'Define scope, budget, and funding before bids.',
    previewLine:
      'Decide what you\u2019re changing, set a realistic budget with contingency, and figure out how you\u2019re paying for it\u2014before you talk to contractors.',
    whatHappens:
      'This is where you go from \u201CI want to renovate\u201D to a clear plan. You look at your home, decide what you want to change and why, and write a scope of work that spells out exactly what\u2019s included. You set a budget\u2014including a contingency cushion\u2014and decide how you\u2019ll fund the project (cash, HELOC, renovation loan, or a combination). Getting clear here prevents regret, blown budgets, and contractor disputes later.',
    decisions: [
      'What rooms or areas are you changing, and what\u2019s staying?',
      'What does \u201Cdone\u201D look like for your household?',
      'What matters most: function, look, resale value, or comfort?',
      'What level of finish: budget, mid-range, or high-end?',
      'Set a total budget with 10\u201315% contingency (lean toward 15% in Hawai\u02BBi)',
      'How will you fund it\u2014cash, HELOC, renovation loan, or a mix?',
      'Is there a written scope document you can hand to multiple contractors?',
    ],
    hawaiiNotes: [
      'Material costs run 15\u201330% above mainland prices due to shipping\u2014budget accordingly',
      'Consider how your home handles humidity, salt air, and UV\u2014these affect what\u2019s realistic',
      'Think about indoor/outdoor flow, which matters more in Hawai\u02BBi than most places',
      'Older homes may have hidden issues (termite damage, asbestos, undersized electrical) that inflate budgets',
      'If using a HELOC, confirm your lender\u2019s draw schedule works with your contractor\u2019s payment terms',
    ],
    pitfalls: [
      'Skipping straight to contractor calls without a written scope',
      'Getting bids without a scope (every quote will cover different things)',
      'Falling in love with Pinterest ideas that don\u2019t fit your climate or budget',
      'Assuming mainland pricing when researching costs online',
      'Starting demolition before a budget and funding plan are set',
      'Forgetting to budget for permits, dumpsters, and temporary housing',
      'Leaving \u201Callowances\u201D vague\u2014spell out what\u2019s included in the price',
    ],
    related: [
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
      { kind: 'guide', title: 'Responsibility Matrix', href: '/resources/playbooks/responsibility-matrix' },
    ],
  },
  {
    id: 'hire-contract',
    number: 2,
    title: 'Hire & Contract',
    subtitle: 'Make bids comparable and lock expectations.',
    previewLine:
      'Compare contractor bids apples-to-apples, negotiate terms that protect you, and sign a contract with clear payment, scope, and change-order language.',
    whatHappens:
      'You take your written scope and send it to multiple contractors so their bids cover the same work. You compare line items, check references, verify licenses, and ask hard questions about timeline, payment terms, and what happens when things change. Before signing, you negotiate the contract: deposits, progress payments, allowances, change-order procedures, and lien releases. If you\u2019re using financing, confirm your lender\u2019s draw schedule aligns with the contractor\u2019s payment milestones.',
    decisions: [
      'Compare contractor bids side by side against the same scope',
      'Check references, licenses (DCCA for work over $1,500), and insurance',
      'Decide if you need a designer, architect, or just a contractor',
      'Negotiate deposit amount, progress payment schedule, and final payment holdback',
      'Agree on change-order procedures: who can approve, what triggers one, and at what cost',
      'Confirm what\u2019s included vs. excluded in each bid (especially allowances)',
      'If financed: confirm lender draw schedule works with contractor payment terms',
    ],
    hawaiiNotes: [
      'Labor availability is tighter\u2014popular contractors book months out',
      'Verify your contractor\u2019s license through DCCA (required for work over $1,500)',
      'Ask about their experience with your home type (post-and-pier, concrete slab, single-wall, etc.)',
      'Confirm who handles shipping logistics for mainland-sourced materials',
    ],
    pitfalls: [
      'Picking the cheapest bid without checking references or scope match',
      'Signing a contract without clear change-order and dispute resolution language',
      'Not confirming the contractor has current insurance and a valid license',
      'Assuming the contractor will figure out the details for you',
      'Making a large deposit without a clear payment milestone structure',
      'Not getting lien waiver language in the contract',
    ],
    related: [
      { kind: 'tool', title: 'Contract Checklist', href: '/app/tools/before-you-sign' },
      { kind: 'guide', title: 'Fair Bid Checklist', href: '/resources/playbooks/fair-bid-checklist' },
      { kind: 'guide', title: 'Responsibility Matrix', href: '/resources/playbooks/responsibility-matrix' },
    ],
  },
  {
    id: 'permits-schedule',
    number: 3,
    title: 'Permits & Schedule',
    subtitle: 'Get approvals and set a realistic start plan.',
    previewLine:
      'Confirm what permits are needed, who files them, and set a realistic project timeline\u2014before any work begins.',
    whatHappens:
      'Your contractor (or you) files for building permits. You finalize the construction schedule, confirm start dates, and make sure the timeline accounts for permitting delays and material lead times. In Hawai\u02BBi, permitting timelines vary significantly by county and scope, so build in buffer.',
    decisions: [
      'Confirm which permits are required (building, electrical, plumbing)',
      'Decide who files\u2014you or the contractor',
      'Set the project start date and outline a rough phase-by-phase timeline',
      'Identify long-lead materials that need ordering before work starts',
      'Arrange temporary living if the kitchen or bathroom will be unusable',
      'Confirm who owns which responsibilities (permits, inspections, material delivery)',
    ],
    hawaiiNotes: [
      'Permitting timelines vary by county: Honolulu can take weeks to months; neighbor islands may be faster or slower depending on the scope',
      'Some HOAs and historic districts have additional review layers',
      'Disposal costs are higher in Hawai\u02BBi\u2014dumpster availability can be limited, so plan ahead',
      'Factor in shipping lead times when setting the construction start date',
    ],
    pitfalls: [
      'Starting work before permits are approved (inspectors can issue stop-work orders)',
      'Not building buffer for permit delays into the timeline',
      'Assuming your contractor handles everything\u2014clarify ownership of each responsibility',
      'Not confirming the contractor has insurance and a current license before permits are pulled',
    ],
    related: [
      { kind: 'guide', title: 'Responsibility Matrix', href: '/resources/playbooks/responsibility-matrix' },
      { kind: 'tool', title: 'Contract Checklist', href: '/app/tools/before-you-sign' },
    ],
  },
  {
    id: 'decide-order',
    number: 4,
    title: 'Decide & Order',
    subtitle: 'Finalize selections and confirm lead times.',
    previewLine:
      'Lock in every material, fixture, and finish selection\u2014and order long-lead items early so your schedule doesn\u2019t stall mid-build.',
    whatHappens:
      'Before demolition begins, you finalize every selection that affects the build: countertops, cabinets, flooring, tile, fixtures, paint colors, and hardware. Then you order anything with a long lead time\u2014cabinets, appliances, windows, specialty tile. Changing these after work starts is how budgets blow up and timelines slip. If materials aren\u2019t ordered early, the project stalls mid-construction waiting for deliveries.',
    decisions: [
      'Finalize the floor plan and any layout changes',
      'Select countertops, cabinets, flooring, and tile',
      'Confirm plumbing fixtures (faucets, showerheads, valves) and share cut sheets',
      'Choose paint colors, hardware (knobs, pulls, towel bars), and lighting fixtures',
      'Lock in cabinet layout and order (these take 4\u201310 weeks)',
      'Confirm appliance models and order (share cut sheets with your contractor)',
      'Order windows and exterior doors (longest lead times)',
      'Order specialty tile or stone with 10\u201315% overage',
    ],
    hawaiiNotes: [
      'Confirm availability and shipping timelines for every selection\u2014some products don\u2019t ship to Hawai\u02BBi',
      'Add 4\u20138 weeks beyond mainland lead times for shipping to Hawai\u02BBi',
      'Salt air and humidity affect material choices: marine-grade hardware, mold-resistant drywall, and UV-stable finishes matter here',
      'Appliance availability is more limited on-island\u2014confirm local stock or shipping timelines',
      'Shipping replacement materials if you run short can add weeks of delay\u2014order extra and keep leftovers',
    ],
    pitfalls: [
      'Changing the scope after construction starts (this is how budgets blow up)',
      'Picking materials without checking lead times',
      'Ordering cabinets before appliance dimensions are confirmed',
      'Not checking dye lots on tile\u2014different batches can look different',
      'Skipping a written scope\u2014verbal agreements lead to disputes',
      'Not confirming appliance dimensions before ordering cabinets',
      'Assuming your contractor will handle all ordering without discussion',
    ],
    related: [
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
  {
    id: 'build-closeout',
    number: 5,
    title: 'Build & Closeout',
    subtitle: 'Track issues as you go, then finish strong.',
    previewLine:
      'Demo, build, install finishes, track issues in real time, and close out the project with inspections, warranties, and a final walkthrough.',
    whatHappens:
      'The old finishes, fixtures, and sometimes walls come out. Hidden problems surface\u2014water damage, mold, outdated wiring, or structural issues. Behind-the-walls work happens (plumbing, electrical, framing), then inspections. Once walls close, the visible finishes go in: drywall, tile, countertops, cabinets, fixtures, and paint. Throughout the build, track issues as they come up\u2014don\u2019t wait for the end. When the work is substantially complete, do a final walkthrough, document anything that needs fixing, confirm all inspections are passed, collect warranty documents, and only then release final payment.',
    decisions: [
      'Confirm what stays and what goes (partial demo vs. full gut)',
      'Decide how to handle surprises: who approves additional work and at what cost',
      'Confirm exact locations for all outlets, switches, and light fixtures before walls close',
      'Lock in plumbing valve positions (shower controls, sink supply lines)',
      'Confirm tile layout and patterns before installation starts',
      'Schedule countertop templating after cabinets are set',
      'Walk every room and document anything that\u2019s not right',
      'Confirm all inspections are passed and permits are closed',
      'Collect warranty info for appliances, countertops, and major systems',
      'Agree on final payment terms\u2014hold a reasonable amount until the fix list is complete',
    ],
    hawaiiNotes: [
      'Homes built before 1978 may have lead paint, asbestos, or canec (sugarcane fiberboard)\u2014testing and proper abatement add time and cost',
      'Termite damage is common and often hidden until demo reveals it',
      'Older homes often have undersized electrical panels\u2014upgrading may be required',
      'Galvanized or polybutylene plumbing is common in older Hawai\u02BBi homes and may need replacing',
      'Humidity can affect paint drying times and tile adhesion\u2014talk to your contractor about timing',
      'Waterproofing is critical in bathrooms, especially with Hawai\u02BBi\u2019s humidity and occasional flood rains',
      'Get maintenance guidance specific to your climate\u2014salt air corrodes faster, UV fades finishes sooner',
      'Keep leftover tile, paint, and hardware for future touch-ups (replacements take weeks to ship)',
    ],
    pitfalls: [
      'No plan for dealing with hidden damage (this is why contingency matters)',
      'Demo-ing more than planned without discussing cost implications first',
      'Not protecting areas of the home that aren\u2019t being renovated',
      'Not walking the job site to verify outlet and fixture locations before walls close',
      'Skipping the inspection\u2014failed inspections discovered later mean opening walls back up',
      'Changing tile selections after waterproofing is done',
      'Not confirming countertop sink cutout dimensions match the actual sink',
      'Rushing paint selection\u2014test samples on the actual walls, not just swatches',
      'Making final payment before the fix list is done',
      'Not getting lien releases from subcontractors',
      'Losing warranty documents\u2014keep them in one place',
    ],
    related: [
      { kind: 'tool', title: 'Fix List', href: '/app/tools/punchlist' },
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
]
