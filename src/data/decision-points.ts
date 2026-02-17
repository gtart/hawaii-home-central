/**
 * @deprecated 2026-02-16
 * Retained for reference only. Canonical replacement: /resources/renovation-stages
 * Do NOT import into production UI.
 */

export interface DecisionPointItemData {
  id: string
  category: string
  summary: string
  group?: string
  why: string
  impacts: string
  ask: string
  hawaiiCallout?: string
}

export interface DecisionPointStageData {
  id: string
  title: string
  subtitle: string
  items: DecisionPointItemData[]
}

export const DECISION_POINT_STAGES: DecisionPointStageData[] = [
  {
    id: 'order-long-lead',
    title: 'Order Long-Lead',
    subtitle: 'Cabinets, appliances, windows/doors, key fixtures',
    items: [
      {
        id: 'order-cabinets',
        category: 'Cabinets & Layout',
        summary: 'Layout finalized with appliance cut sheets before ordering',
        why: 'Cabinets are built to specific dimensions based on the appliances they surround. Ordering cabinets before appliance models are locked means risking gaps, misalignment, or costly filler pieces.',
        impacts: 'Cabinet dimensions, appliance fit, countertop templating, plumbing rough-in locations, and overall kitchen workflow.',
        ask: 'Have all appliance cut sheets been shared with the cabinetmaker, and are filler pieces and end panels specified?',
      },
      {
        id: 'order-appliances',
        category: 'Appliances',
        summary: 'Model numbers and cut sheets shared with GC and cabinetmaker',
        why: 'Every appliance has specific requirements: electrical circuits, gas lines, venting paths, water supply locations, and clearances. The cut sheet is the source of truth.',
        impacts: 'Cabinet sizing, electrical rough-in, venting paths, gas line routing, and water supply placement.',
        ask: 'Are model numbers confirmed (not just brand), and have cut sheets been shared with the GC, electrician, plumber, and cabinetmaker?',
        hawaiiCallout: 'Appliance availability in Hawaiʻi is more limited than on the mainland. Confirm local stock or shipping timelines before committing. Some brands have limited service networks on the islands.',
      },
      {
        id: 'order-windows-doors',
        category: 'Windows & Doors',
        summary: 'Sizes, glass type, color, and egress confirmed',
        why: 'Windows and exterior doors have some of the longest lead times in a renovation. Once ordered, changes are expensive or impossible. The wrong size means reframing.',
        impacts: 'Framing plan, inspections, energy code compliance, lead time, and project schedule.',
        ask: 'Do exact sizes match the framing plan, and is the glass type (tempered, Low-E) confirmed for each opening?',
        hawaiiCallout: 'Shipping windows to Hawaiʻi adds 4–8 weeks beyond mainland lead times. Salt-air exposure means aluminum-clad or fiberglass frames hold up better than bare wood. Confirm marine-grade hardware.',
      },
      {
        id: 'order-plumbing-fixtures',
        category: 'Key Plumbing Fixtures',
        summary: 'Fixture models confirmed and compatible with planned rough-in',
        why: 'A wall-mount faucet requires a different rough-in than a deck-mount. A rain showerhead needs a ceiling connection, not a wall arm. Fixtures chosen after rough-in mean tearing out walls or compromising.',
        impacts: 'Valve type and placement, drain locations, wall depth requirements, and rough-in scheduling.',
        ask: 'Are valve type and brand confirmed, and do rough-in dimensions match the fixture spec sheets?',
        hawaiiCallout: 'Shipping fixtures to Hawaiʻi means longer replacement timelines if something arrives damaged. Order early and inspect upon delivery.',
      },
      {
        id: 'order-tile-surfaces',
        category: 'Tile & Surfaces',
        summary: 'Long-lead tile or stone selections ordered with adequate overage',
        why: 'Natural stone slabs, specialty tile, and imported materials can have lead times of 6–12 weeks. Running short mid-project means waiting for a restock that may not match the original dye lot.',
        impacts: 'Project schedule, tile layout planning, material quantity calculations, and budget.',
        ask: 'Is the tile or stone ordered with 10–15% overage, and has the dye lot been confirmed?',
        hawaiiCallout: 'Shipping replacement tile to Hawaiʻi if you run short can delay your project by weeks. Order adequate overage and keep leftovers for future repairs.',
      },
    ],
  },
  {
    id: 'lock-rough-in',
    title: 'Lock Rough-In',
    subtitle: 'Plumbing + electrical locations that go inside walls',
    items: [
      {
        id: 'roughin-shower-controls',
        category: 'Shower/Tub Controls',
        summary: 'Valve type, depth, and height confirmed for wall-mounted controls',
        group: 'Plumbing',
        why: 'Wall-mounted plumbing rough-in is buried inside the wall. The valve body, supply lines, and blocking must be positioned precisely. Getting this wrong means opening the wall after it’s closed.',
        impacts: 'Valve placement, wall thickness requirements, trim kit compatibility, and inspection timing.',
        ask: 'What finished wall depth does this valve require, and does the trim kit match the valve body?',
      },
      {
        id: 'roughin-drains',
        category: 'Drain & Waste Layout',
        summary: 'Drain locations locked for shower, tub, and kitchen sink',
        group: 'Plumbing',
        why: 'Drain locations are set in concrete or subfloor framing. Moving them after rough-in means cutting into the slab or reframing—both expensive and time-consuming.',
        impacts: 'Floor slope direction, waterproofing system compatibility, fixture footprint alignment, and tile layout.',
        ask: 'Are all drain positions confirmed (center, offset, or linear), and do they match the waterproofing system?',
      },
      {
        id: 'roughin-kitchen-plumbing',
        category: 'Kitchen Plumbing',
        summary: 'Sink, dishwasher, disposal, and pot-filler requirements confirmed',
        group: 'Plumbing',
        why: 'Kitchen plumbing involves multiple connections in a tight space: hot and cold supply, drain, dishwasher drain and supply, garbage disposal wiring, and sometimes a pot-filler line. Missing any of these during rough-in means opening finished walls or cabinets later.',
        impacts: 'Cabinet base layout, countertop cutout placement, electrical requirements, and inspection scheduling.',
        ask: 'Are all water supply, drain, and electrical connections mapped for the sink base area, including dishwasher and disposal?',
      },
      {
        id: 'roughin-lighting',
        category: 'Lighting Locations',
        summary: 'Sconce vs. overhead decisions finalized with box locations marked',
        group: 'Electrical',
        why: 'Electrical box placement is permanent once walls are closed. A sconce at 66 inches looks intentional; at 60 inches it looks like a mistake. Symmetry, switch groupings, and dimmer compatibility must be resolved before wires are run.',
        impacts: 'Box placement, switch locations and groupings, dimmer compatibility, and overall lighting design.',
        ask: 'Are exact box locations marked on the wall with tape, and are switch groupings and dimmer specs confirmed?',
      },
      {
        id: 'roughin-vanity-power',
        category: 'Vanity & Mirror Power',
        summary: 'Power requirements confirmed for lighted mirrors and accessories',
        group: 'Electrical',
        why: 'Lighted mirrors, heated towel bars, in-drawer outlets, and specialty fixtures all need dedicated power. If the circuit isn’t there during rough-in, adding it later means opening finished walls.',
        impacts: 'Circuit planning, GFCI placement, electrical panel capacity, and inspection requirements.',
        ask: 'Which vanity features need power, and is GFCI protection planned for all bathroom and kitchen circuits?',
        hawaiiCallout: 'Older Hawaiʻi homes often have undersized electrical panels and non-standard wiring paths through post-and-pier foundations. Confirm panel capacity early—an upgrade adds significant cost and time.',
      },
      {
        id: 'roughin-undercabinet',
        category: 'Under-Cabinet Lighting',
        summary: 'Plan and driver/power location confirmed for kitchen task lighting',
        group: 'Electrical',
        why: 'Under-cabinet lighting needs a power source and often an LED driver that must be concealed. If the outlet or junction box isn’t roughed in above the cabinets or inside a utility cabinet, there’s nowhere to connect the lights.',
        impacts: 'Electrical box placement above cabinets, driver location, switch grouping, and dimmer compatibility.',
        ask: 'Is the power source location confirmed for under-cabinet lights, and is the driver/transformer location planned?',
      },
      {
        id: 'roughin-dedicated-circuits',
        category: 'Dedicated Circuits',
        summary: 'Circuits confirmed for range, oven, microwave, and other loads',
        group: 'Electrical',
        why: 'Many kitchen appliances require dedicated circuits (range, wall oven, microwave, dishwasher, disposal, refrigerator). Missing a circuit during rough-in means running new wire after walls are closed.',
        impacts: 'Electrical panel capacity, circuit breaker sizing, wire gauge, and code compliance.',
        ask: 'Does the panel have capacity for all required dedicated circuits, and are wire gauges correct for each appliance load?',
      },
    ],
  },
  {
    id: 'close-walls',
    title: 'Close Walls',
    subtitle: 'Blocking, ventilation routing, insulation checks',
    items: [
      {
        id: 'walls-blocking',
        category: 'Blocking & Backing',
        summary: 'Installed for shower glass, heavy mirrors, grab bars, TV mounts',
        why: 'Blocking is solid wood backing inside the wall for anything heavy that mounts later. Without it, towel bars pull out of drywall, shower glass panels can’t be anchored, and grab bars have nothing to grip. This is also the time to future-proof for aging-in-place.',
        impacts: 'Shower glass installation, towel bar and grab bar mounting, TV bracket support, and heavy mirror hanging.',
        ask: 'Is blocking installed for all planned wall-mounted items, including future grab bar locations?',
      },
      {
        id: 'walls-bath-fan',
        category: 'Bath Fan Routing',
        summary: 'Duct routes and exterior termination points confirmed',
        why: 'Bathroom exhaust fans need a clear path to the exterior. Fans that vent into the attic create moisture problems. Ducts that take long, winding paths reduce airflow and effectiveness.',
        impacts: 'Moisture control, mold prevention, code compliance, and long-term air quality.',
        ask: 'Does each bathroom fan duct terminate at an exterior wall or roof cap—never into an attic or soffit?',
        hawaiiCallout: 'Hawaiʻi’s humidity makes bathroom ventilation more important than in drier climates. Undersized or poorly routed fans lead to mold and mildew. Consider humidity-sensing fans that run automatically.',
      },
      {
        id: 'walls-range-hood',
        category: 'Range Hood Ducting',
        summary: 'Duct route confirmed to exterior with adequate CFM',
        why: 'A range hood that recirculates instead of exhausting to the exterior is far less effective. The duct route needs to be planned before walls close—running a 6-inch or 8-inch duct through finished walls is destructive and expensive.',
        impacts: 'Kitchen air quality, grease buildup, code compliance, and cabinet/soffit design above the range.',
        ask: 'Is the range hood duct routed to an exterior termination point, and does the CFM rating match the range output?',
      },
      {
        id: 'walls-insulation',
        category: 'Sound & Moisture Insulation',
        summary: 'Insulation decisions confirmed for wet walls and shared walls',
        why: 'Once drywall goes up, adding insulation means tearing it back down. Sound insulation between bathrooms and bedrooms, and moisture-appropriate insulation in wet areas, must be decided before walls close.',
        impacts: 'Sound transmission, moisture management, energy performance, and long-term comfort.',
        ask: 'Is sound insulation planned between noisy rooms, and is the insulation type appropriate for moisture exposure?',
        hawaiiCallout: 'Hawaiʻi’s humid climate makes moisture management critical. Spray foam can trap moisture if not detailed correctly. Discuss vapor barriers and airflow strategy with your contractor.',
      },
      {
        id: 'walls-inwall-features',
        category: 'In-Wall Features',
        summary: 'Niches, recessed cabinets, and medicine cabinet openings finalized',
        why: 'Shower niches, medicine cabinets, and recessed toilet paper holders all require framing changes before drywall. Once walls are closed, adding these means cutting and reframing—messy, expensive, and never as clean.',
        impacts: 'Framing layout, drywall scope, tile layout (niches must align with tile courses), and product rough-opening dimensions.',
        ask: 'Are all niche locations, sizes, and depths confirmed, and do recessed cabinet rough openings match the product specs?',
      },
    ],
  },
  {
    id: 'waterproof-tile',
    title: 'Waterproof + Tile',
    subtitle: 'Shower system, drains, tile layout decisions',
    items: [
      {
        id: 'tile-waterproofing',
        category: 'Waterproofing System',
        summary: 'Method and warranty ownership confirmed',
        why: 'Tile is not waterproof—the system behind it is. A failed waterproofing system means a full tear-out. This is the single most consequential decision in any bathroom renovation.',
        impacts: 'Long-term water damage prevention, warranty coverage, tile adhesion, and the entire shower lifespan.',
        ask: 'What waterproofing system is being used, who warranties it, and is it compatible with the chosen tile and setting materials?',
      },
      {
        id: 'tile-drain',
        category: 'Drain Type & Location',
        summary: 'Linear vs. center drain confirmed with compatible waterproofing',
        why: 'The drain type determines the floor slope. A center drain requires a four-way slope. A linear drain requires a single-direction slope. Changing the drain type after the pre-slope is set means demolishing and rebuilding the shower floor.',
        impacts: 'Floor slope direction, tile layout, waterproofing integration, and drain grate finish selection.',
        ask: 'Is the drain type confirmed (center, linear wall, linear threshold), and is it compatible with the waterproofing system?',
      },
      {
        id: 'tile-niches',
        category: 'Niche Dimensions',
        summary: 'Size, position, and alignment with tile courses confirmed',
        why: 'Niche placement needs to align with tile courses to avoid awkward cuts. A niche that falls between tiles creates visible slivers and weak grout lines. Getting this right means planning the niche dimensions around the tile size.',
        impacts: 'Tile layout, material waste, visual quality of the finished shower, and waterproofing at niche edges.',
        ask: 'Do the niche dimensions align with full tile courses, and is waterproofing detailed at all niche edges and corners?',
      },
      {
        id: 'tile-layout',
        category: 'Tile Layout Rules',
        summary: 'Starting points, edge trim, grout width, and alignment resolved',
        why: 'Tile layout determines where cuts fall—and bad cuts are immediately visible. A centered layout avoids slivers at edges. Trim pieces (bullnose, Schluter strips, mitered edges) affect both aesthetics and material ordering.',
        impacts: 'Visual quality, material quantity (cuts increase waste), grout line consistency, and edge finishing.',
        ask: 'Is the starting point confirmed for each surface, and is the edge trim type specified (bullnose, metal, mitered)?',
        hawaiiCallout: 'Shipping replacement tile to Hawaiʻi if you run short can delay your project by weeks. Order adequate overage and keep leftover tile for future repairs.',
      },
    ],
  },
  {
    id: 'closeout',
    title: 'Closeout',
    subtitle: 'Punch list, warranties, final fixture checks',
    items: [
      {
        id: 'closeout-punchlist',
        category: 'Punch List Process',
        summary: 'Walkthrough expectations and completion timeline agreed',
        why: 'The punch list is where many projects stall. Without a clear process, small items linger for weeks or months. Both parties need to agree on scope, walkthrough format, and timeline before final payment.',
        impacts: 'Project completion timeline, final payment release, retainage terms, and homeowner satisfaction.',
        ask: 'When does the walkthrough happen, what format is the punch list, and how long does the contractor have to complete items?',
      },
      {
        id: 'closeout-fixture-check',
        category: 'Fixture Install Check',
        summary: 'All lights, mirrors, accessories, and hardware installed and inspected',
        why: 'Fixtures, mirrors, towel bars, and hardware are often the last items installed and the first to be forgotten. A final fixture check ensures nothing was skipped and everything operates correctly before the contractor demobilizes.',
        impacts: 'Completeness of the finished project, punch list length, and post-project callback frequency.',
        ask: 'Is there a fixture installation checklist, and has every item been tested (lights dimming, faucets flowing, doors latching)?',
      },
      {
        id: 'closeout-warranties',
        category: 'Warranty & Documentation',
        summary: 'Manuals, warranty docs, spare tile, and paint codes collected',
        why: 'Appliances, fixtures, waterproofing systems, and workmanship all carry warranties—but only if you have the documentation. Once the contractor leaves, tracking down warranty info becomes your problem.',
        impacts: 'Long-term warranty coverage, maintenance planning, future repair costs, and resale documentation.',
        ask: 'Will the contractor provide all warranty documents, maintenance instructions, and leftover materials at project completion?',
      },
    ],
  },
]
