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
    id: 'dream',
    number: 1,
    title: 'Dream',
    subtitle: 'Envision the result and set priorities',
    previewLine:
      'Decide what you want to change, what \u2018success\u2019 looks like, and what matters most to your household.',
    whatHappens:
      'This is the inspiration phase. You look at your home with fresh eyes and decide what you actually want to change and why. You talk to your household about priorities, visit showrooms or browse ideas, and start building a wish list. Most people skip this step and jump straight into budgets \u2014 but clarity here prevents regret later.',
    decisions: [
      'What rooms or areas do you want to change?',
      'What does \u201Cdone\u201D look like for your household?',
      'What matters most: function, look, resale value, or comfort?',
      'Are there things you definitely don\u2019t want to change?',
    ],
    hawaiiNotes: [
      'Consider how your home handles humidity, salt air, and UV \u2014 these affect what\u2019s realistic',
      'Think about indoor/outdoor flow, which matters more in Hawai\u02BBi than most places',
      'Older homes may have character worth preserving (single-wall construction, post-and-pier)',
    ],
    pitfalls: [
      'Skipping this step and jumping straight into contractor calls',
      'Letting one person\u2019s vision dominate without household buy-in',
      'Falling in love with Pinterest ideas that don\u2019t fit your climate or budget',
    ],
    related: [
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
  {
    id: 'define-scope',
    number: 2,
    title: 'Define the Scope',
    subtitle: 'Write down exactly what\u2019s included',
    previewLine:
      'Write a clear scope: which rooms, what changes, and what\u2019s included vs not included\u2014so bids are comparable.',
    whatHappens:
      'You turn your wish list into a written scope of work. This document spells out exactly what\u2019s being done, what\u2019s not, and what level of finish you expect. It\u2019s what you\u2019ll hand to contractors so they can give you apples-to-apples bids. Without it, every quote covers different things.',
    decisions: [
      'Which rooms are in scope and which are not?',
      'What specific changes are you making (layout, fixtures, finishes)?',
      'What level of finish: budget, mid-range, or high-end?',
      'Is there a written scope document you can hand to multiple contractors?',
    ],
    hawaiiNotes: [
      'Confirm material availability before locking in specifics \u2014 some items don\u2019t ship to Hawai\u02BBi or have 8+ week lead times',
      'Include salt-air and humidity requirements in your scope (marine-grade hardware, mold-resistant drywall, UV-stable finishes)',
    ],
    pitfalls: [
      'Getting bids without a written scope (every quote will cover different things)',
      'Leaving \u201Callowances\u201D vague \u2014 spell out what\u2019s included in the price',
      'Assuming the contractor will figure out the details for you',
    ],
    related: [
      { kind: 'tool', title: 'Contract Comparison Tool', href: '/app/tools/before-you-sign' },
      { kind: 'guide', title: 'Fair Bid Checklist', href: '/resources/playbooks/fair-bid-checklist' },
    ],
  },
  {
    id: 'set-plan',
    number: 3,
    title: 'Set the Plan',
    subtitle: 'Budget, team, and timeline',
    previewLine:
      'Set a realistic budget (with contingency), pick your team (GC/designer/architect), and outline a rough timeline.',
    whatHappens:
      'You set a total budget including a contingency cushion, decide who\u2019s on your team (general contractor, designer, architect, or some combination), and map out a rough timeline. This is also when you compare bids and check references. Most people underbudget here \u2014 especially in Hawai\u02BBi.',
    decisions: [
      'Set a total budget with 10\u201315% contingency',
      'Decide if you need a designer, architect, or just a contractor',
      'Compare contractor bids and check references',
      'Outline a rough project timeline',
    ],
    hawaiiNotes: [
      'Material costs run 15\u201330% above mainland prices due to shipping',
      'Labor availability is tighter \u2014 popular contractors book months out',
      'Older homes often have hidden issues (termite damage, asbestos, undersized electrical) that inflate budgets',
      'Lean toward 15% contingency rather than 10%',
    ],
    pitfalls: [
      'Starting demolition before a budget is set',
      'Forgetting to budget for permits, dumpsters, and temporary housing',
      'Assuming mainland pricing when researching costs online',
      'Picking the cheapest bid without checking references or scope match',
    ],
    related: [
      { kind: 'guide', title: 'Responsibility Matrix', href: '/resources/playbooks/responsibility-matrix' },
      { kind: 'tool', title: 'Contract Comparison Tool', href: '/app/tools/before-you-sign' },
    ],
  },
  {
    id: 'permits-scheduling',
    number: 4,
    title: 'Permits & Scheduling',
    subtitle: 'File permits, sign the contract, lock dates',
    previewLine:
      'Confirm what permits are needed and who files them, then lock a realistic start date and sequence.',
    whatHappens:
      'Your contractor (or you) files for building permits. You finalize the construction schedule, sign the contract, and confirm start dates. In Hawai\u02BBi, permitting timelines vary significantly by county.',
    decisions: [
      'Confirm which permits are required (building, electrical, plumbing)',
      'Decide who files \u2014 you or the contractor',
      'Sign the construction contract with clear payment and change-order terms',
      'Set the project start date and rough timeline',
    ],
    hawaiiNotes: [
      'Permitting timelines vary by county: Honolulu can take weeks to months; neighbor islands may be faster or slower depending on the scope',
      'Verify your contractor\u2019s license through DCCA (required for work over $1,500)',
      'Some HOAs and historic districts have additional review layers',
    ],
    pitfalls: [
      'Starting work before permits are approved (inspectors can issue stop-work orders)',
      'Signing a contract without clear change-order language',
      'Not confirming the contractor has insurance and a current license',
    ],
    related: [
      { kind: 'guide', title: 'Responsibility Matrix', href: '/resources/playbooks/responsibility-matrix' },
    ],
  },
  {
    id: 'finalize-choices',
    number: 5,
    title: 'Finalize Your Choices',
    subtitle: 'Lock in materials, fixtures, and finishes',
    previewLine:
      'Make the key choices that affect construction\u2014layout, materials, fixtures, and finishes\u2014so work doesn\u2019t stall later.',
    whatHappens:
      'Before any ordering or construction begins, you finalize every selection that affects the build: countertops, cabinets, flooring, tile, fixtures, paint colors, and hardware. Changing these after work starts is how budgets blow up and timelines slip.',
    decisions: [
      'Finalize the floor plan and any layout changes',
      'Select countertops, cabinets, flooring, and tile',
      'Confirm plumbing fixtures (faucets, showerheads, valves) and share cut sheets',
      'Choose paint colors, hardware (knobs, pulls, towel bars), and lighting fixtures',
    ],
    hawaiiNotes: [
      'Confirm availability and shipping timelines for every selection \u2014 some products don\u2019t ship to Hawai\u02BBi',
      'Salt air and humidity affect material choices: marine-grade hardware, mold-resistant drywall, and UV-stable finishes matter here',
    ],
    pitfalls: [
      'Changing the scope after construction starts (this is how budgets blow up)',
      'Picking materials without checking lead times',
      'Skipping a written scope \u2014 verbal agreements lead to disputes',
      'Not confirming appliance dimensions before ordering cabinets',
    ],
    related: [
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
  {
    id: 'order-reserve',
    number: 6,
    title: 'Order & Reserve',
    subtitle: 'Long-lead items that take weeks to arrive',
    previewLine:
      'Order long-lead items and reserve critical materials early so your schedule doesn\u2019t get pushed by shipping delays.',
    whatHappens:
      'Before demolition starts, you order anything with a long lead time \u2014 cabinets, appliances, windows, specialty tile, and key fixtures. If these aren\u2019t ordered early, the project stalls mid-construction waiting for deliveries.',
    decisions: [
      'Lock in cabinet layout and order (these take 4\u201310 weeks)',
      'Confirm appliance models and order (share cut sheets with your contractor)',
      'Order windows and exterior doors (longest lead times)',
      'Order specialty tile or stone with 10\u201315% overage',
      'Confirm plumbing fixture models (faucets, showerheads, valves)',
    ],
    hawaiiNotes: [
      'Add 4\u20138 weeks beyond mainland lead times for shipping to Hawai\u02BBi',
      'Appliance availability is more limited on-island \u2014 confirm local stock or shipping timelines',
      'Shipping replacement materials if you run short can add weeks of delay',
      'Order extra and keep leftovers for future repairs',
    ],
    pitfalls: [
      'Ordering cabinets before appliance dimensions are confirmed',
      'Not checking dye lots on tile \u2014 different batches can look different',
      'Assuming your contractor will handle all ordering without discussion',
    ],
    related: [
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
  {
    id: 'build',
    number: 7,
    title: 'Build',
    subtitle: 'Demo, structural work, and behind-the-walls',
    previewLine:
      'Remove what\u2019s there, build what\u2019s changing, and get the behind-the-walls work done and approved before closing things up.',
    whatHappens:
      'The old finishes, fixtures, and sometimes walls come out. The site is prepped for new work, and hidden problems surface \u2014 water damage, mold, outdated wiring, or structural issues. Then the behind-the-walls work happens: plumbing pipes, electrical wiring, framing changes, and HVAC ducts. Once inspections pass and walls close, changes become very expensive.',
    decisions: [
      'Confirm what stays and what goes (partial demo vs. full gut)',
      'Decide how to handle surprises: who approves additional work and at what cost',
      'Arrange temporary living if the kitchen or bathroom will be unusable',
      'Confirm exact locations for all outlets, switches, and light fixtures before walls close',
      'Lock in plumbing valve positions (shower controls, sink supply lines)',
      'Finalize any framing or structural changes',
    ],
    hawaiiNotes: [
      'Homes built before 1978 may have lead paint, asbestos, or canec (sugarcane fiberboard) \u2014 testing and proper abatement add time and cost',
      'Termite damage is common and often hidden until demo reveals it',
      'Disposal costs are higher in Hawai\u02BBi \u2014 dumpster availability can be limited',
      'Older homes often have undersized electrical panels \u2014 upgrading may be required',
      'Galvanized or polybutylene plumbing is common in older Hawai\u02BBi homes and may need replacing',
    ],
    pitfalls: [
      'No plan for dealing with hidden damage (this is why contingency matters)',
      'Demo-ing more than planned without discussing cost implications first',
      'Not protecting areas of the home that aren\u2019t being renovated',
      'Not walking the job site to verify outlet and fixture locations before walls close',
      'Skipping the inspection \u2014 failed inspections discovered later mean opening walls back up',
    ],
    related: [
      { kind: 'tool', title: 'Fix List', href: '/app/tools/punchlist' },
    ],
  },
  {
    id: 'install-finish',
    number: 8,
    title: 'Install & Finish',
    subtitle: 'Countertops, tile, fixtures, paint',
    previewLine:
      'Install the visible finishes\u2014tile, cabinets, flooring, fixtures\u2014and bring everything to the final look and function.',
    whatHappens:
      'The visible work begins: drywall, tile, countertops, cabinets, fixtures, and paint. This is when the renovation starts looking like a finished space. It\u2019s also when decisions stack up fast.',
    decisions: [
      'Confirm tile layout and patterns before installation starts',
      'Schedule countertop templating after cabinets are set',
      'Choose paint colors and finishes',
      'Confirm hardware (knobs, pulls, towel bars, toilet paper holders)',
    ],
    hawaiiNotes: [
      'Humidity can affect paint drying times and tile adhesion \u2014 talk to your contractor about timing',
      'Waterproofing is critical in bathrooms, especially with Hawai\u02BBi\u2019s humidity and occasional flood rains',
    ],
    pitfalls: [
      'Changing tile selections after waterproofing is done',
      'Not confirming countertop sink cutout dimensions match the actual sink',
      'Rushing paint selection \u2014 test samples on the actual walls, not just swatches',
    ],
    related: [
      { kind: 'tool', title: 'Fix List', href: '/app/tools/punchlist' },
      { kind: 'tool', title: 'Decision Tracker', href: '/app/tools/finish-decisions' },
    ],
  },
  {
    id: 'punch-list-closeout',
    number: 9,
    title: 'Punch List & Closeout',
    subtitle: 'Final details, inspections, warranty',
    previewLine:
      'Fix the remaining issues, collect warranties/docs, confirm final inspections, and only then make final payments.',
    whatHappens:
      'You walk through the finished project with your contractor and make a list of everything that needs fixing, adjusting, or touching up. Final inspections happen. You get warranty documents and close out the project.',
    decisions: [
      'Walk every room and document anything that\u2019s not right',
      'Confirm all inspections are passed and permits are closed',
      'Collect warranty info for appliances, countertops, and major systems',
      'Agree on final payment terms \u2014 hold a reasonable amount until punch list is complete',
    ],
    hawaiiNotes: [
      'Get maintenance guidance specific to your climate \u2014 salt air corrodes faster, UV fades finishes sooner',
      'Keep leftover tile, paint, and hardware for future touch-ups (replacements take weeks to ship)',
    ],
    pitfalls: [
      'Making final payment before the punch list is done',
      'Not getting lien releases from subcontractors',
      'Losing warranty documents \u2014 keep them in one place',
    ],
    related: [
      { kind: 'tool', title: 'Fix List', href: '/app/tools/punchlist' },
    ],
  },
]
