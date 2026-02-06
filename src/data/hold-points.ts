export interface HoldPointItemData {
  id: string
  label: string
  whyItMatters: string
  whatToConfirm: string
  hawaiiCallout?: string
}

export interface HoldPointStageData {
  id: string
  title: string
  subtitle: string
  items: HoldPointItemData[]
}

export const HOLD_POINT_STAGES: HoldPointStageData[] = [
  {
    id: 'before-ordering',
    title: 'Before Ordering',
    subtitle: 'Long-lead items',
    items: [
      {
        id: 'order-windows-doors',
        label: 'Sizes, glass, color, and egress requirements confirmed for windows and exterior doors',
        whyItMatters: 'Windows and exterior doors have some of the longest lead times in a renovation. Once ordered, changes are expensive or impossible. The wrong size means reframing. The wrong glass spec means failed inspections or poor energy performance.',
        whatToConfirm: 'Confirm exact sizes match the framing plan. Verify glass type (tempered where required, Low-E for energy code). Confirm color finish and hardware. Check egress requirements for bedrooms. Get the lead time in writing.',
        hawaiiCallout: 'Shipping windows to Hawai\u02BBi adds 4\u20138 weeks beyond mainland lead times. Salt-air exposure means aluminum-clad or fiberglass frames hold up better than bare wood. Confirm marine-grade hardware.',
      },
      {
        id: 'order-cabinets-millwork',
        label: 'Cabinet layout finalized after appliance models are chosen',
        whyItMatters: 'Cabinets are built to specific dimensions based on the appliances they surround. Ordering cabinets before appliance models are locked means risking gaps, misalignment, or costly filler pieces. A 30-inch range and a 36-inch range need different cabinet layouts.',
        whatToConfirm: 'Confirm all appliance cut sheets have been shared with the cabinetmaker or supplier. Verify filler pieces, end panels, and trim details are specified. Check that sink base dimensions match the sink and faucet you\u2019ve chosen.',
      },
      {
        id: 'order-appliances',
        label: 'Appliance model numbers and cut sheets shared with GC and cabinetmaker',
        whyItMatters: 'Every appliance has specific requirements: electrical circuits, gas lines, venting paths, water supply locations, and clearances. The cut sheet is the source of truth. Without it, rough-in work is based on assumptions.',
        whatToConfirm: 'Confirm model numbers (not just brand or series). Share cut sheets with the GC, electrician, plumber, and cabinetmaker. Verify power requirements (voltage, amperage, circuit type). Check venting requirements for range hoods and dryers.',
        hawaiiCallout: 'Appliance availability in Hawai\u02BBi is more limited than on the mainland. Confirm local stock or shipping timelines before committing to a model. Some brands have limited service networks on the islands.',
      },
      {
        id: 'order-plumbing-fixtures',
        label: 'Plumbing fixture models confirmed and compatible with planned rough-in',
        whyItMatters: 'A wall-mount faucet requires a different rough-in than a deck-mount. A rain showerhead needs a ceiling connection, not a wall arm. If fixtures are chosen after rough-in, you\u2019re either tearing out walls or compromising on the fixture.',
        whatToConfirm: 'Confirm valve type and brand compatibility (mixing valves are not universal). Verify rough-in dimensions match the fixture spec sheet. Check that drain locations align with the fixture footprint. Confirm handle orientation and trim style.',
        hawaiiCallout: 'Shipping fixtures to Hawai\u02BBi means longer replacement timelines if something arrives damaged. Order early and inspect upon delivery. Keep original packaging until installation is confirmed.',
      },
    ],
  },
  {
    id: 'before-rough-in',
    title: 'Before Rough-In',
    subtitle: 'Plumbing & electrical',
    items: [
      {
        id: 'roughin-shower-controls',
        label: 'Valve type, depth, and height confirmed for wall-mounted faucets and shower controls',
        whyItMatters: 'Wall-mounted plumbing rough-in is buried inside the wall. The valve body, supply lines, and blocking must be positioned precisely for the chosen fixture. Getting this wrong means opening the wall after it\u2019s closed\u2014one of the most expensive fixes in a renovation.',
        whatToConfirm: 'Ask your contractor: "What finished wall depth does this valve require?" Confirm the valve brand and model match the trim kit. Verify mounting height matches your design intent and code requirements. Check that hot and cold supply lines are on the correct sides.',
      },
      {
        id: 'roughin-shower-tub',
        label: 'Drain location, valve type, and control layout confirmed for shower and tub',
        whyItMatters: 'Shower and tub drain locations are set in concrete or subfloor framing. Moving them after rough-in means cutting into the slab or reframing the floor\u2014both expensive and time-consuming. The valve type determines the entire control wall layout.',
        whatToConfirm: 'Confirm drain position (center, offset, or linear). Verify the drain matches the waterproofing system. Check that the valve rough-in depth accounts for the finished wall thickness (tile + backer board + waterproofing membrane).',
      },
      {
        id: 'roughin-lighting',
        label: 'Sconce vs. overhead lighting decisions finalized with locations marked',
        whyItMatters: 'Electrical box placement is permanent once walls are closed. A sconce at 66 inches looks intentional; a sconce at 60 inches looks like a mistake. Symmetry, switch locations, and dimmer compatibility all need to be resolved before wires are run.',
        whatToConfirm: 'Confirm exact box locations for all sconces, pendants, and recessed lights. Verify switch locations and groupings (which lights are on which switch). Check dimmer compatibility with the chosen fixtures. Mark locations on the wall with tape before rough-in.',
      },
      {
        id: 'roughin-electrical-vanity',
        label: 'Power requirements confirmed for vanities, mirrors, and specialty fixtures',
        whyItMatters: 'Lighted mirrors, heated towel bars, in-drawer outlets, and under-cabinet lighting all need power. If the circuit isn\u2019t there during rough-in, adding it later means opening finished walls. GFCI requirements near water sources must be planned, not retrofitted.',
        whatToConfirm: 'Confirm which vanity features need power (lighted mirror, outlet inside cabinet, towel warmer). Verify GFCI protection is planned for all bathroom and kitchen circuits. Check that the electrical panel has capacity for new circuits.',
        hawaiiCallout: 'Older Hawai\u02BBi homes often have undersized electrical panels and non-standard wiring paths through post-and-pier foundations. Confirm panel capacity early\u2014an upgrade can add significant cost and time.',
      },
    ],
  },
  {
    id: 'before-insulation-drywall',
    title: 'Before Insulation & Drywall',
    subtitle: 'Closing the walls',
    items: [
      {
        id: 'drywall-insulation',
        label: 'Insulation type and locations confirmed (thermal, sound, attic)',
        whyItMatters: 'Once drywall goes up, adding insulation means tearing it back down. Sound insulation between bedrooms and bathrooms, thermal insulation in exterior walls, and attic insulation strategy all need to be decided before the walls close. This is your last chance to address comfort and energy performance.',
        whatToConfirm: 'Confirm insulation type for each location (fiberglass batts, spray foam, mineral wool). Verify sound insulation is planned between noisy rooms (bathrooms, laundry, media rooms). Check that attic insulation meets current energy code requirements.',
        hawaiiCallout: 'Hawai\u02BBi\u2019s humid climate makes moisture management critical. Spray foam can trap moisture if not detailed correctly. Ventilation strategy matters as much as insulation type. Discuss vapor barriers and airflow with your contractor.',
      },
      {
        id: 'drywall-inwall-features',
        label: 'Niches, recessed cabinets, and blocking for wall-mounted items finalized',
        whyItMatters: 'Shower niches, medicine cabinets, recessed toilet paper holders, and wall-mounted TVs all require framing changes before drywall. Blocking (solid wood backing inside the wall) must be installed now for anything heavy that mounts to the wall later\u2014towel bars, grab bars, floating shelves, TV brackets.',
        whatToConfirm: 'Confirm all niche locations, sizes, and depths. Verify blocking is installed for towel bars, grab bars, TV mounts, and heavy mirrors. Check that recessed cabinet rough openings match the product dimensions. Walk the job with your contractor before drywall starts.',
      },
      {
        id: 'drywall-ventilation',
        label: 'Bathroom fan routes and termination points confirmed',
        whyItMatters: 'Bathroom exhaust fans need a clear path to the exterior. If the duct route isn\u2019t planned before insulation and drywall, you end up with fans that vent into the attic (creating moisture problems) or ducts that take unnecessarily long paths (reducing airflow).',
        whatToConfirm: 'Confirm each bathroom has a fan with adequate CFM rating. Verify the duct route terminates at an exterior wall or roof cap\u2014never into an attic or soffit. Check that the duct run is as short and straight as possible.',
        hawaiiCallout: 'Hawai\u02BBi\u2019s humidity makes bathroom ventilation more important than in drier climates. Undersized or poorly routed fans lead to mold and mildew. Consider humidity-sensing fans that run automatically.',
      },
    ],
  },
  {
    id: 'before-waterproofing-tile',
    title: 'Before Waterproofing & Tile',
    subtitle: 'Wet area finishes',
    items: [
      {
        id: 'tile-waterproofing',
        label: 'Shower waterproofing system and details agreed upon',
        whyItMatters: 'Tile is not waterproof\u2014the waterproofing system behind and beneath the tile is what keeps water out of your walls and floor. A failed waterproofing system means a full tear-out. This is the single most consequential decision in any bathroom renovation.',
        whatToConfirm: 'Confirm the waterproofing system (sheet membrane like Kerdi, liquid-applied like RedGard, or foam panel like Wedi). Verify the system is compatible with the chosen tile and setting materials. Check that all penetrations (valve, showerhead, niche) are detailed in the waterproofing plan.',
      },
      {
        id: 'tile-drain',
        label: 'Linear vs. center drain type and exact location confirmed',
        whyItMatters: 'The drain type determines the floor slope. A center drain requires a four-way slope. A linear drain requires a single-direction slope. Changing the drain type after the mud bed or pre-slope is set means demolishing and rebuilding the shower floor.',
        whatToConfirm: 'Confirm drain type (center point, linear wall, linear threshold). Verify the drain body is compatible with the waterproofing system. Check that the drain grate finish matches your hardware selections. Confirm the drain location works with your tile layout.',
      },
      {
        id: 'tile-layout',
        label: 'Tile starting points, niche placement, and trim details resolved',
        whyItMatters: 'Tile layout determines where cuts fall\u2014and bad cuts are immediately visible. A centered layout in a shower avoids slivers at the edges. Niche placement needs to align with tile courses to avoid awkward cuts. Trim pieces (bullnose, Schluter strips, mitered edges) affect both aesthetics and material ordering.',
        whatToConfirm: 'Confirm the starting point for each tiled surface. Verify niche dimensions align with full tile courses. Check that edge trim type is specified (bullnose, metal edge, mitered). Confirm the grout joint width and color. Get a material quantity that includes 10\u201315% overage for cuts and future repairs.',
        hawaiiCallout: 'Shipping replacement tile to Hawai\u02BBi if you run short can delay your project by weeks. Order adequate overage upfront and keep leftover tile for future repairs.',
      },
    ],
  },
  {
    id: 'before-final-closeout',
    title: 'Before Final & Closeout',
    subtitle: 'Finishing & handoff',
    items: [
      {
        id: 'closeout-punchlist',
        label: 'Punch list process and expectations agreed upon',
        whyItMatters: 'The punch list is where many projects stall. Without a clear process, small items linger for weeks or months. Both parties need to agree on what constitutes a punch list item, how the walkthrough works, and what the timeline is for completing items before final payment is released.',
        whatToConfirm: 'Confirm when the walkthrough happens (at substantial completion, not after final payment). Agree on a written punch list format. Set a timeline for punch list completion (typically 2\u20134 weeks). Clarify that final payment or retainage is tied to punch list completion.',
      },
      {
        id: 'closeout-warranties',
        label: 'Warranty documentation and product manuals delivered',
        whyItMatters: 'Appliances, fixtures, roofing, waterproofing systems, and the contractor\u2019s own workmanship all carry warranties\u2014but only if you have the documentation. Once the contractor leaves, tracking down warranty information becomes your problem.',
        whatToConfirm: 'Confirm the contractor will provide all manufacturer warranty documents at project completion. Verify the workmanship warranty terms and duration (1\u20132 years is standard). Request maintenance instructions for any systems that require it (HVAC filters, water heater flushing, etc.).',
      },
    ],
  },
]
