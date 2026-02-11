export type Priority = 'essential' | 'nice-to-know'

export interface ChecklistItemData {
  id: string
  label: string
  detail: string
  priority: Priority
  hawaiiCallout?: string
}

export interface ChecklistSectionData {
  id: string
  title: string
  why: string
  items: ChecklistItemData[]
}

export const CHECKLIST_SECTIONS: ChecklistSectionData[] = [
  {
    id: 'scope-documents',
    title: 'Scope & Documents',
    why: 'A clear scope prevents the most common source of disputes: "I thought that was included."',
    items: [
      {
        id: 'scope-written-description',
        label: 'Is there a written scope of work describing exactly what will and won’t be done?',
        detail: 'The scope should be specific enough that a third party could read it and understand the project. Avoid vague language like "renovate bathroom." Instead, look for details: "demo existing tile, install new porcelain tile on floor and shower walls, replace vanity and toilet, install new fixtures."',
        priority: 'essential',
      },
      {
        id: 'scope-plans-referenced',
        label: 'Are architectural drawings or plans referenced and attached?',
        detail: 'If you have plans, every bid should reference the same version. If contractors are bidding on different scopes, you can’t compare costs meaningfully.',
        priority: 'essential',
      },
      {
        id: 'scope-specs-included',
        label: 'Are finish selections and specifications listed or attached?',
        detail: 'Tile, fixtures, cabinetry, paint colors, hardware—every material choice affects cost. A bid without specs is a guess.',
        priority: 'nice-to-know',
      },
      {
        id: 'scope-demo-included',
        label: 'Is demolition scope clearly defined?',
        detail: 'Demo is often assumed but rarely spelled out. Who removes existing materials? Where does debris go? Is hazmat abatement included? These are real costs.',
        priority: 'essential',
        hawaiiCallout: 'In older Hawaiʻi homes (pre-1978), lead paint and asbestos are common. Abatement adds significant cost and must be handled by licensed professionals.',
      },
    ],
  },
  {
    id: 'labor-breakdown',
    title: 'Labor Breakdown',
    why: 'Understanding labor costs helps you evaluate whether a bid is fair—or whether corners are being cut.',
    items: [
      {
        id: 'labor-trades-listed',
        label: 'Are all trades and subcontractors identified?',
        detail: 'A general contractor typically coordinates multiple subs: plumber, electrician, tiler, painter, etc. The bid should identify who handles what. If the GC is doing everything themselves, that’s worth understanding too.',
        priority: 'nice-to-know',
      },
      {
        id: 'labor-rates-transparent',
        label: 'Are labor rates or labor costs broken out separately from materials?',
        detail: 'You don’t need hourly rates for every worker, but you should be able to see labor as a distinct line item. This helps you compare bids and understand where costs differ.',
        priority: 'essential',
      },
      {
        id: 'labor-supervision',
        label: 'Is project supervision or management included in the bid?',
        detail: 'Someone needs to coordinate the schedule, check quality, and communicate with you. That person’s time should be accounted for—either as a line item or folded into overhead.',
        priority: 'nice-to-know',
      },
      {
        id: 'labor-licensing',
        label: 'Does the contractor hold the appropriate license for this work?',
        detail: 'In Hawaiʻi, any project over $1,500 requires a licensed contractor. Verify the license type matches the work (e.g., B-general building, C-specialty). Check at the DCCA PVL website.',
        priority: 'essential',
        hawaiiCallout: 'Hawaiʻi requires contractor licensing through the Department of Commerce and Consumer Affairs (DCCA). Verify active status and correct classification before signing.',
      },
    ],
  },
  {
    id: 'materials-specifications',
    title: 'Materials & Specifications',
    why: 'Material choices drive a huge portion of cost. Apples-to-apples comparison requires clear specs.',
    items: [
      {
        id: 'materials-brand-model',
        label: 'Are specific brands, models, or SKUs listed for major materials?',
        detail: '"Quartz countertop" can mean $40/sq ft or $120/sq ft depending on the brand and color. The bid should specify actual products, not just categories.',
        priority: 'essential',
      },
      {
        id: 'materials-grade-quality',
        label: 'Is the grade or quality level specified for each material?',
        detail: 'Builder-grade vs. premium makes a real difference in cost and longevity. Make sure each contractor is bidding the same quality level, or note where they differ.',
        priority: 'nice-to-know',
      },
      {
        id: 'materials-procurement',
        label: 'Who is responsible for purchasing materials?',
        detail: 'Some contractors mark up materials; others prefer you buy direct. Neither is wrong, but you need to know which approach each bid assumes so you’re comparing the same thing.',
        priority: 'essential',
        hawaiiCallout: 'Shipping materials to Hawaiʻi adds 15–30% to mainland prices, plus 2–6 weeks for delivery. Confirm whether shipping costs are included in the bid or separate.',
      },
      {
        id: 'materials-durability',
        label: 'Are materials appropriate for local environmental conditions?',
        detail: 'Not all materials hold up equally in every climate. Your contractor should be recommending products suitable for your specific conditions.',
        priority: 'nice-to-know',
        hawaiiCallout: 'Salt air, UV exposure, and humidity are tough on building materials. Look for marine-grade hardware, UV-resistant finishes, and moisture-resistant substrates. Ask if the contractor has experience with these conditions.',
      },
    ],
  },
  {
    id: 'allowances',
    title: 'Allowances',
    why: 'Allowances are the most common hiding place for budget surprises. Understand them or expect overruns.',
    items: [
      {
        id: 'allowances-identified',
        label: 'Are all allowances clearly identified with specific dollar amounts?',
        detail: 'An allowance is a placeholder budget for items not yet selected (like light fixtures or tile). Each allowance should state exactly what it covers and how much is allocated. Low allowances make a bid look cheaper but lead to change orders later.',
        priority: 'essential',
      },
      {
        id: 'allowances-realistic',
        label: 'Are allowance amounts realistic for the specified quality level?',
        detail: 'A $500 allowance for a kitchen faucet might cover builder-grade but not the style you want. Ask the contractor what the allowance actually buys and compare against real product prices.',
        priority: 'essential',
      },
      {
        id: 'allowances-overage',
        label: 'What happens if you exceed an allowance?',
        detail: 'The bid should state how overages are handled. Is it a straight cost pass-through, or does the contractor add markup? Is there a credit if you come in under the allowance?',
        priority: 'nice-to-know',
      },
      {
        id: 'allowances-installation',
        label: 'Does the allowance include installation, or just the material cost?',
        detail: 'A tile allowance of $5/sq ft might mean $5 for the tile only—installation labor, thinset, grout, and backer board are separate. Clarify this for every allowance.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'permits-inspections',
    title: 'Permits & Inspections',
    why: 'Unpermitted work creates liability, reduces resale value, and can require costly corrections.',
    items: [
      {
        id: 'permits-included',
        label: 'Are permit costs included in the bid?',
        detail: 'Building permits, plumbing permits, electrical permits—each has a fee. The bid should state whether these fees are included or if you pay them separately.',
        priority: 'essential',
        hawaiiCallout: 'Hawaiʻi permitting varies significantly by county. Honolulu (DPP), Maui, Hawaiʻi County, and Kauaʻi each have different processes, fees, and timelines. Ask which permits are needed and how long they typically take in your county.',
      },
      {
        id: 'permits-who-pulls',
        label: 'Who is responsible for pulling permits?',
        detail: 'Typically the contractor pulls permits, but this should be stated explicitly. The permit holder is legally responsible for the work meeting code.',
        priority: 'essential',
      },
      {
        id: 'permits-inspections-scheduled',
        label: 'Are required inspections accounted for in the timeline?',
        detail: 'Most permitted work requires multiple inspections (rough-in, final, etc.). Failed inspections mean rework and delays. The timeline should account for inspection scheduling.',
        priority: 'nice-to-know',
        hawaiiCallout: 'Inspection wait times in Hawaiʻi can be unpredictable—sometimes a few days, sometimes weeks, depending on the county and time of year. Build buffer into your expectations.',
      },
      {
        id: 'permits-code-compliance',
        label: 'Does the bid reference current building code requirements?',
        detail: 'Renovations often trigger code upgrades (electrical panel, smoke detectors, structural requirements). A thorough bid accounts for these—a vague one may hit you with change orders later.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'timeline-sequencing',
    title: 'Timeline & Sequencing',
    why: 'A realistic timeline protects both parties. Overly optimistic schedules lead to frustration and finger-pointing.',
    items: [
      {
        id: 'timeline-start-date',
        label: 'Is there a projected start date and estimated completion date?',
        detail: 'Both dates should be stated. If a contractor can’t commit to a start date, that’s useful information—it may mean they’re overbooked or uncertain about permit timing.',
        priority: 'essential',
      },
      {
        id: 'timeline-milestones',
        label: 'Are major milestones or phases outlined?',
        detail: 'A good bid breaks the project into phases: demo, rough-in, inspections, finish work, punch list. This lets you track progress against the plan.',
        priority: 'nice-to-know',
      },
      {
        id: 'timeline-lead-times',
        label: 'Are material lead times factored into the schedule?',
        detail: 'Custom cabinets might take 8–12 weeks. Special-order tile might take 4–6 weeks. If these aren’t ordered early, the project stalls mid-stream.',
        priority: 'essential',
        hawaiiCallout: 'Add 2–6 weeks to mainland lead times for ocean shipping. Container delays, port congestion, and inter-island transfers can extend timelines further. Order early.',
      },
      {
        id: 'timeline-delays',
        label: 'How are delays handled? Is there a penalty or notice provision?',
        detail: 'Weather, material shortages, and inspection delays happen. The contract should describe how delays are communicated and whether any liquidated damages or timeline extensions apply.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'change-orders',
    title: 'Change Orders',
    why: 'Change orders are inevitable on most projects. A clear process prevents disputes and cost surprises.',
    items: [
      {
        id: 'change-process',
        label: 'Is there a defined change order process?',
        detail: 'Changes should be documented in writing before work proceeds. The process should state: who initiates, how cost is calculated, who approves, and how it affects the timeline.',
        priority: 'essential',
      },
      {
        id: 'change-markup',
        label: 'What is the markup on change order work?',
        detail: 'Contractors typically add overhead and profit to change orders—often 15–25%. This should be stated upfront, not discovered after the fact.',
        priority: 'essential',
      },
      {
        id: 'change-written-approval',
        label: 'Is written approval required before change order work begins?',
        detail: 'Verbal agreements lead to disputes. Both parties should sign off on scope, cost, and timeline impact before any changed work starts.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'exclusions-assumptions',
    title: 'Exclusions & Assumptions',
    why: 'What’s NOT in the bid is just as important as what is. Exclusions are where surprise costs hide.',
    items: [
      {
        id: 'exclusions-listed',
        label: 'Are exclusions clearly listed?',
        detail: 'Common exclusions: landscaping, furniture removal, window treatments, appliance installation, HVAC modifications. If it’s not explicitly included, assume it’s excluded.',
        priority: 'essential',
      },
      {
        id: 'exclusions-assumptions',
        label: 'Are the contractor’s assumptions stated?',
        detail: 'Assumptions might include: "existing framing is sound," "no mold behind walls," "electrical panel has capacity for new circuits." If an assumption turns out to be wrong, expect a change order.',
        priority: 'essential',
      },
      {
        id: 'exclusions-hazmat',
        label: 'Is hazardous material abatement addressed?',
        detail: 'Lead paint, asbestos, mold—if discovered during demo, who pays? The bid should state whether abatement is included or excluded, and how discoveries are handled.',
        priority: 'nice-to-know',
        hawaiiCallout: 'Many Hawaiʻi homes built before 1978 contain lead paint and/or asbestos in flooring, insulation, or siding. Budget for testing before demo begins.',
      },
      {
        id: 'exclusions-structural',
        label: 'Are potential structural surprises acknowledged?',
        detail: 'Older homes often reveal surprises behind walls: termite damage, improper framing, outdated wiring. A responsible bid acknowledges this possibility and describes how it’s handled.',
        priority: 'nice-to-know',
        hawaiiCallout: 'Termite damage is extremely common in Hawaiʻi, especially in older homes. Post-and-pier foundations and wood-frame construction are particularly vulnerable. Expect the unexpected.',
      },
    ],
  },
  {
    id: 'site-conditions',
    title: 'Site Conditions & Contingencies',
    why: 'Your specific site affects cost. Access, terrain, and environmental factors are real budget items.',
    items: [
      {
        id: 'site-access',
        label: 'Are site access constraints addressed?',
        detail: 'Narrow driveways, stairs, elevators, limited parking—these affect material delivery and labor efficiency. If access is difficult, the bid should reflect it.',
        priority: 'nice-to-know',
        hawaiiCallout: 'Many Hawaiʻi properties have challenging access: steep driveways, narrow lanes, limited staging areas. Hillside homes may require crane lifts for materials. Confirm the contractor has visited the site.',
      },
      {
        id: 'site-protection',
        label: 'Does the bid include site protection and cleanup?',
        detail: 'Floor protection, dust barriers, daily cleanup, final cleaning—these should be included. If they’re not mentioned, ask.',
        priority: 'nice-to-know',
      },
      {
        id: 'site-contingency',
        label: 'Is there a contingency budget or how are unforeseen conditions handled?',
        detail: 'A 10–15% contingency is standard for renovations. Some contractors build it into the bid; others recommend you hold it separately. Either way, you should have a plan for surprises.',
        priority: 'essential',
      },
      {
        id: 'site-utilities',
        label: 'Are temporary utilities or services accounted for?',
        detail: 'Portable toilets, temporary power, dumpster rentals, water access—these are real costs that should appear somewhere in the bid.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'payment-terms',
    title: 'Payment Terms',
    why: 'Payment structure protects both parties. Too much upfront exposes the homeowner; too little exposes the contractor.',
    items: [
      {
        id: 'payment-schedule',
        label: 'Is the payment schedule tied to milestones, not just dates?',
        detail: 'Milestone-based payments (e.g., 10% at signing, 25% at rough-in completion, 25% at drywall, 30% at substantial completion, 10% at final punch list) protect both parties. Avoid front-loaded schedules.',
        priority: 'essential',
      },
      {
        id: 'payment-deposit',
        label: 'Is the initial deposit reasonable?',
        detail: 'A 10–15% deposit is typical. Be cautious of contractors asking for 30%+ upfront—that’s a red flag unless there are significant material pre-orders required.',
        priority: 'essential',
        hawaiiCallout: 'Hawaiʻi contractors sometimes request larger deposits to cover material shipping costs. If the deposit exceeds 15%, ask for an itemized breakdown of what it covers.',
      },
      {
        id: 'payment-retainage',
        label: 'Is there a retainage or final holdback?',
        detail: 'Holding 5–10% until the punch list is complete is standard practice. It ensures the contractor finishes the small details. This should be stated in the contract.',
        priority: 'essential',
      },
      {
        id: 'payment-methods',
        label: 'Are accepted payment methods and invoicing terms stated?',
        detail: 'Check, bank transfer, credit card (with potential surcharge)—know what’s expected. Also confirm how often invoices are sent and how quickly payment is expected.',
        priority: 'nice-to-know',
      },
    ],
  },
  {
    id: 'warranty-punchlist',
    title: 'Warranty & Punch List',
    why: 'The project isn’t done until the punch list is done. And warranty terms define your protection after that.',
    items: [
      {
        id: 'warranty-workmanship',
        label: 'Is there a workmanship warranty, and for how long?',
        detail: 'A 1-year workmanship warranty is standard. Some contractors offer 2 years. This covers defects in the contractor’s work (not material failures). Get it in writing.',
        priority: 'essential',
      },
      {
        id: 'warranty-materials',
        label: 'Are material and product warranties passed through to the homeowner?',
        detail: 'Appliances, fixtures, roofing materials—these often have manufacturer warranties. The contractor should provide all warranty documentation at project completion.',
        priority: 'nice-to-know',
      },
      {
        id: 'warranty-punchlist-process',
        label: 'Is there a defined punch list process?',
        detail: 'The walkthrough should produce a written punch list. The contractor should have a stated timeline for completing punch items (typically 2–4 weeks). Final payment is released after punch list completion.',
        priority: 'essential',
      },
      {
        id: 'warranty-callback',
        label: 'What is the process for warranty claims after the project is complete?',
        detail: 'Who do you call? What’s the response time? Are there exclusions (e.g., normal wear and tear, homeowner modifications)? A clear callback process gives you confidence that the contractor stands behind their work.',
        priority: 'nice-to-know',
      },
    ],
  },
]
