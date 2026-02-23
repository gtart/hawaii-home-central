/**
 * Seed curated ContentRelation records for all 16 published articles.
 * Run: npx tsx scripts/seed-related-content.ts
 *
 * Relations are curated by topic affinity — articles within the same
 * category first, then cross-category matches where genuinely relevant.
 * Each article has 3 outgoing relations (priority 1–3).
 */
import { prisma } from '../src/lib/prisma'

// Article IDs
const IDs = {
  competingIncentives:        'cmlhmumet000xm9bbw6jckzqy',
  builtInRefrigerators:       'cmlyyovq00000jl04rizl2r1c',
  contractorFit:              'cmlhmuzx70029m9bb4uo95tsv',
  decisionFatigue:            'cmlhabek7000km9fcy5layl1v',
  tooManyWindows:             'cmlyyp5gc0011jl04ul140gcx',
  flooringLayout:             'cmlyyoz39000cjl0457dv7qa7',
  howContractorsMakeMoney:    'cmlhab8nb0000m9fc0c2bi5cn',
  howToChooseContractor:      'cmlhabbsc000am9fcmqy33g9f',
  jalouisieWindows:           'cmlyypejz0021jl04m88sze34',
  oahuMicroLandscapes:        'cmlyyp25x000ojl04aq7nub7c',
  pierAndPost:                'cmlyyp8fw001djl04ro79vjn9',
  solar:                      'cmlyypb7j001ojl045w45l72f',
  theFinishTrap:              'cmlhmuwja001xm9bbqdpoxhou',
  theRealHiddenCost:          'cmlyyphul002ejl041q8jf9n8',
  whenTradesDontAgree:        'cmlhmupuh0019m9bb01p0xgfd',
  youDontAlwaysGetWhatYouWant:'cmlhmut5f001lm9bbuz0uj0zo',
}

const { A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P } = {
  A: IDs.competingIncentives,
  B: IDs.builtInRefrigerators,
  C: IDs.contractorFit,
  D: IDs.decisionFatigue,
  E: IDs.tooManyWindows,
  F: IDs.flooringLayout,
  G: IDs.howContractorsMakeMoney,
  H: IDs.howToChooseContractor,
  I: IDs.jalouisieWindows,
  J: IDs.oahuMicroLandscapes,
  K: IDs.pierAndPost,
  L: IDs.solar,
  M: IDs.theFinishTrap,
  N: IDs.theRealHiddenCost,
  O: IDs.whenTradesDontAgree,
  P: IDs.youDontAlwaysGetWhatYouWant,
}

// [fromId, toId, priority]
const relations: [string, string, number][] = [
  // --- Working with Contractors ---
  // Competing Incentives → How Contractors Make Money, When Trades Don't Agree, Contractor Fit
  [A, G, 1], [A, O, 2], [A, C, 3],
  // Contractor Fit → How to Choose a Contractor, Competing Incentives, How Contractors Make Money
  [C, H, 1], [C, A, 2], [C, G, 3],
  // How Contractors Make Money → Competing Incentives, How to Choose a Contractor, When Trades Don't Agree
  [G, A, 1], [G, H, 2], [G, O, 3],
  // How to Choose a Contractor → Contractor Fit, How Contractors Make Money, Competing Incentives
  [H, C, 1], [H, G, 2], [H, A, 3],
  // When Trades Don't Agree → Competing Incentives, How Contractors Make Money, How to Choose a Contractor
  [O, A, 1], [O, G, 2], [O, H, 3],

  // --- Planning Your Renovation ---
  // Decision Fatigue → The Finish Trap, The Real Hidden Cost, You Don't Always Get What You Want
  [D, M, 1], [D, N, 2], [D, P, 3],
  // The Finish Trap → Decision Fatigue, You Don't Always Get What You Want, The Real Hidden Cost
  [M, D, 1], [M, P, 2], [M, N, 3],
  // The Real Hidden Cost → Decision Fatigue, The Finish Trap, You Don't Always Get What You Want
  [N, D, 1], [N, M, 2], [N, P, 3],
  // You Don't Always Get What You Want → The Real Hidden Cost, The Finish Trap, Decision Fatigue
  [P, N, 1], [P, M, 2], [P, D, 3],

  // --- Design & Selections ---
  // Built-In Refrigerators → Flooring Layout, Decision Fatigue, The Finish Trap
  [B, F, 1], [B, D, 2], [B, M, 3],
  // Flooring Layout → Built-In Refrigerators, Decision Fatigue, You Don't Always Get What You Want
  [F, B, 1], [F, D, 2], [F, P, 3],

  // --- Materials & Climate ---
  // Too Many Windows → Jalousie Windows, Oʻahu Micro-Landscapes, Pier-and-Post Homes
  [E, I, 1], [E, J, 2], [E, K, 3],
  // Jalousie Windows → Too Many Windows, Oʻahu Micro-Landscapes, Pier-and-Post Homes
  [I, E, 1], [I, J, 2], [I, K, 3],
  // Oʻahu Micro-Landscapes → Too Many Windows, Jalousie Windows, Solar
  [J, E, 1], [J, I, 2], [J, L, 3],

  // --- Structural & Exterior ---
  // Pier-and-Post Homes → Oʻahu Micro-Landscapes, How to Choose a Contractor, Competing Incentives
  [K, J, 1], [K, H, 2], [K, A, 3],

  // --- Solar ---
  // Solar → Oʻahu Micro-Landscapes, You Don't Always Get What You Want, The Real Hidden Cost
  [L, J, 1], [L, P, 2], [L, N, 3],
]

async function main() {
  console.log(`Seeding ${relations.length} ContentRelation records…`)

  // Clear existing
  const deleted = await prisma.contentRelation.deleteMany({})
  console.log(`Deleted ${deleted.count} existing relations`)

  let created = 0
  for (const [fromContentId, toContentId, priority] of relations) {
    await prisma.contentRelation.create({
      data: { fromContentId, toContentId, priority },
    })
    created++
  }

  console.log(`Created ${created} relations ✓`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
