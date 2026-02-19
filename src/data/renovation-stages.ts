export interface RenovationStage {
  id: string
  number: number
  title: string
  subtitle: string
  doThisNow: string
  topDecisions: string[]
  whatHappens: string
  decisions: string[]
  hawaiiNotes: string[]
  pitfalls: string[]
}

export const RENOVATION_STAGES: RenovationStage[] = [
  {
    id: 'plan-budget',
    number: 1,
    title: 'Plan & Budget',
    subtitle: 'Set goals, research costs, build your budget',
    doThisNow: 'Define your renovation goals, set a realistic budget with contingency, and decide whether you need a designer, architect, or just a contractor.',
    topDecisions: [
      'Set a total budget with 10–15% contingency',
      'Define your scope: which rooms and what level of finish',
      'Decide if you need a designer or architect',
    ],
    whatHappens:
      'This is where you define what you want out of the renovation and what you can realistically spend. You research costs, talk to other homeowners, and start building a list of priorities. Most people underbudget here — especially in Hawaiʻi.',
    decisions: [
      'Define your goals: what rooms, what level of finish, and what matters most',
      'Set a realistic total budget including a 10–15% contingency',
      'Decide whether you need a designer, architect, or just a contractor',
      'Research rough costs for your project type (kitchen, bath, whole-house)',
    ],
    hawaiiNotes: [
      'Material costs run 15–30% above mainland prices due to shipping',
      'Labor availability is tighter — popular contractors book months out',
      'Older homes often have hidden issues (termite damage, asbestos, undersized electrical panels) that inflate budgets',
      'Lean toward 15% contingency rather than 10%',
    ],
    pitfalls: [
      'Starting demolition before a budget is set',
      'Forgetting to budget for permits, dumpsters, and temporary housing',
      'Assuming mainland pricing when researching costs online',
    ],
  },
  {
    id: 'design-scope',
    number: 2,
    title: 'Design & Scope',
    subtitle: 'What are we building? Finalize plans and specs',
    doThisNow: 'Turn your goals into a detailed plan — floor plans, material selections, and a written scope of work that everyone builds from.',
    topDecisions: [
      'Finalize the floor plan and layout',
      'Select key materials: countertops, cabinets, flooring',
      'Get a detailed written scope from your contractor',
    ],
    whatHappens:
      'You work with a designer or contractor to turn your goals into a plan — floor plans, elevations, material selections, and a written scope of work. This is the blueprint everyone will build from.',
    decisions: [
      'Finalize the floor plan and layout changes',
      'Choose the level of finish for each room (budget, mid-range, high-end)',
      'Select key materials: countertops, cabinets, flooring, tile',
      'Get a detailed written scope of work from your contractor',
    ],
    hawaiiNotes: [
      "Confirm material availability before falling in love with a product \u2014 some items don't ship to Hawai\u02BBi or have 8+ week lead times",
      'Salt air and humidity affect material choices: marine-grade hardware, mold-resistant drywall, and UV-stable finishes matter here',
    ],
    pitfalls: [
      'Changing the scope after construction starts (this is how budgets blow up)',
      'Picking materials without checking lead times',
      'Skipping a written scope — verbal agreements lead to disputes',
    ],
  },
  {
    id: 'permits-scheduling',
    number: 3,
    title: 'Permits & Scheduling',
    subtitle: 'File permits, line up your contractor',
    doThisNow: 'File for building permits, sign the construction contract with clear terms, and lock in your project start date.',
    topDecisions: [
      'Confirm which permits are required and who files them',
      'Sign the contract with clear payment and change-order terms',
      'Set the project start date and timeline',
    ],
    whatHappens:
      'Your contractor (or you) files for building permits. You finalize the construction schedule, sign the contract, and confirm start dates. In Hawaiʻi, permitting timelines vary significantly by county.',
    decisions: [
      'Confirm which permits are required (building, electrical, plumbing)',
      'Decide who files — you or the contractor',
      'Sign the construction contract with clear payment terms',
      'Set the project start date and rough timeline',
    ],
    hawaiiNotes: [
      'Permitting timelines vary by county: Honolulu can take weeks to months; neighbor islands may be faster or slower depending on the scope',
      "Verify your contractor's license through DCCA (required for work over $1,500)",
      'Some HOAs and historic districts have additional review layers',
    ],
    pitfalls: [
      'Starting work before permits are approved (inspectors can issue stop-work orders)',
      'Signing a contract without clear change-order language',
      'Not confirming the contractor has insurance and a current license',
    ],
  },
  {
    id: 'order-early',
    number: 4,
    title: 'Order Early',
    subtitle: 'Items that take weeks to arrive',
    doThisNow: 'Order every long-lead item before demolition starts — cabinets, appliances, windows, specialty tile, and key fixtures.',
    topDecisions: [
      'Lock in cabinet layout and order (4–10 week lead time)',
      'Confirm and order appliances (share cut sheets with contractor)',
      'Order specialty tile or stone with 10–15% overage',
    ],
    whatHappens:
      "Before demolition starts, you order anything with a long lead time \u2014 cabinets, appliances, windows, specialty tile, and key fixtures. If these aren't ordered early, the project stalls mid-construction waiting for deliveries.",
    decisions: [
      'Lock in cabinet layout and order (these take 4–10 weeks)',
      'Confirm appliance models and order (share cut sheets with your contractor)',
      'Order windows and exterior doors (longest lead times)',
      'Order specialty tile or stone with 10–15% overage',
      'Confirm plumbing fixture models (faucets, showerheads, valves)',
    ],
    hawaiiNotes: [
      'Add 4–8 weeks beyond mainland lead times for shipping to Hawaiʻi',
      'Appliance availability is more limited on-island — confirm local stock or shipping timelines',
      'Shipping replacement materials if you run short can add weeks of delay',
      'Order extra and keep leftovers for future repairs',
    ],
    pitfalls: [
      'Ordering cabinets before appliance dimensions are confirmed',
      'Not checking dye lots on tile — different batches can look different',
      'Assuming your contractor will handle all ordering without discussion',
    ],
  },
  {
    id: 'demo-prep',
    number: 5,
    title: 'Demo & Prep',
    subtitle: 'Tear-out and site preparation',
    doThisNow: 'Confirm what stays and what goes, agree on how surprises will be handled, and arrange temporary living if needed.',
    topDecisions: [
      'Decide partial demo vs. full gut for each area',
      'Agree on who approves additional work and at what cost',
      'Arrange temporary living if kitchen or bath will be unusable',
    ],
    whatHappens:
      'The old finishes, fixtures, and sometimes walls come out. The site is prepped for new work. This is when hidden problems surface — water damage, mold, outdated wiring, or structural issues.',
    decisions: [
      'Confirm what stays and what goes (partial demo vs. full gut)',
      'Decide how to handle surprises: who approves additional work and at what cost',
      'Arrange temporary living if the kitchen or bathroom will be unusable',
    ],
    hawaiiNotes: [
      'Homes built before 1978 may have lead paint, asbestos, or canec (sugarcane fiberboard) — testing and proper abatement add time and cost',
      'Termite damage is common and often hidden until demo reveals it',
      'Disposal costs are higher in Hawaiʻi — dumpster availability can be limited',
    ],
    pitfalls: [
      'No plan for dealing with hidden damage (this is why contingency matters)',
      'Demo-ing more than planned without discussing cost implications first',
      "Not protecting areas of the home that aren't being renovated",
    ],
  },
  {
    id: 'rough-in',
    number: 6,
    title: 'Rough-In',
    subtitle: 'Inside the walls — plumbing, electrical, framing',
    doThisNow: 'Walk the site and confirm exact locations for every outlet, switch, fixture, and valve before walls close up.',
    topDecisions: [
      'Confirm all outlet, switch, and light fixture locations',
      'Lock in plumbing valve positions (shower controls, supply lines)',
      'Finalize recessed lighting and ceiling fan placement',
    ],
    whatHappens:
      'This is the work that happens inside the walls before they get closed up: plumbing pipes, electrical wiring, framing changes, and HVAC ducts. Once the walls close, changes become very expensive.',
    decisions: [
      'Confirm exact locations for all outlets, switches, and light fixtures',
      'Lock in plumbing valve positions (shower controls, sink supply lines)',
      'Finalize any framing or structural changes',
      'Decide on recessed lighting and ceiling fan locations',
    ],
    hawaiiNotes: [
      'Older homes often have undersized electrical panels — upgrading the panel may be required for modern loads',
      'Galvanized or polybutylene plumbing is common in older Hawaiʻi homes and may need replacing',
    ],
    pitfalls: [
      'Not walking the job site to verify outlet and fixture locations before walls close',
      'Choosing a wall-mount faucet after deck-mount rough-in is done',
      'Skipping the inspection — failed inspections discovered later mean opening walls back up',
    ],
  },
  {
    id: 'finishes-install',
    number: 7,
    title: 'Finishes & Install',
    subtitle: 'Countertops, tile, fixtures, paint',
    doThisNow: 'Confirm tile layouts, schedule countertop templating after cabinets are set, and finalize paint colors and hardware.',
    topDecisions: [
      'Confirm tile layout and patterns before installation',
      'Schedule countertop templating after cabinets are installed',
      'Choose paint colors and all hardware (knobs, pulls, bars)',
    ],
    whatHappens:
      "The visible work begins: drywall, tile, countertops, cabinets, fixtures, and paint. This is when the renovation starts looking like a finished space. It's also when decisions stack up fast.",
    decisions: [
      'Confirm tile layout and patterns before installation starts',
      'Schedule countertop templating after cabinets are set',
      'Choose paint colors and finishes',
      'Confirm hardware (knobs, pulls, towel bars, toilet paper holders)',
    ],
    hawaiiNotes: [
      'Humidity can affect paint drying times and tile adhesion — talk to your contractor about timing',
      "Waterproofing is critical in bathrooms, especially with Hawai\u02BBi's humidity and occasional flood rains",
    ],
    pitfalls: [
      'Changing tile selections after waterproofing is done',
      'Not confirming countertop sink cutout dimensions match the actual sink',
      'Rushing paint selection — test samples on the actual walls, not just swatches',
    ],
  },
  {
    id: 'punch-list-closeout',
    number: 8,
    title: 'Punch List & Closeout',
    subtitle: 'Final details, inspections, warranty',
    doThisNow: 'Walk every room with your contractor, document everything that needs fixing, and collect warranty info before making final payment.',
    topDecisions: [
      'Document every punch list item room by room',
      'Confirm all inspections passed and permits closed',
      'Agree on final payment terms tied to punch list completion',
    ],
    whatHappens:
      'You walk through the finished project with your contractor and make a list of everything that needs fixing, adjusting, or touching up. Final inspections happen. You get warranty documents and close out the project.',
    decisions: [
      "Walk every room and document anything that's not right",
      'Confirm all inspections are passed and permits are closed',
      'Collect warranty info for appliances, countertops, and major systems',
      'Agree on final payment terms — hold a reasonable amount until punch list is complete',
    ],
    hawaiiNotes: [
      'Get maintenance guidance specific to your climate — salt air corrodes faster, UV fades finishes sooner',
      'Keep leftover tile, paint, and hardware for future touch-ups (replacements take weeks to ship)',
    ],
    pitfalls: [
      'Making final payment before the punch list is done',
      'Not getting lien releases from subcontractors',
      'Losing warranty documents — keep them in one place',
    ],
  },
]
