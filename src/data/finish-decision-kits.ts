import type { KitAuthorType, RoomTypeV3 } from './finish-decisions'

// ============================================================================
// Ideas Pack (Kit) Catalog
// ============================================================================

export interface KitOption {
  name: string
  notes: string
}

export interface KitDecision {
  /** Must match a decision title exactly (case-insensitive) to merge options */
  title: string
  options: KitOption[]
}

export interface FinishDecisionKit {
  id: string
  label: string
  description: string
  author: KitAuthorType
  /** Room types this kit applies to (empty = universal) */
  roomTypes: RoomTypeV3[]
  /** Decision titles this kit can enhance (used for decision-level matching) */
  decisionTitles: string[]
  decisions: KitDecision[]
}

// ============================================================================
// Kit Catalog
// ============================================================================

export const KITS: FinishDecisionKit[] = [
  // --- Kitchen Kits ---
  {
    id: 'kit-modern-kitchen',
    label: 'Modern Kitchen',
    description: 'Clean lines, quartz countertops, and stainless steel. A popular starting point for contemporary kitchens.',
    author: 'hhc',
    roomTypes: ['kitchen'],
    decisionTitles: ['Countertop', 'Cabinetry', 'Backsplash', 'Sink & Faucet', 'Appliances - Range'],
    decisions: [
      {
        title: 'Countertop',
        options: [
          { name: 'White Quartz', notes: 'Caesarstone or Silestone. Durable, non-porous, low maintenance. Popular: Calacatta Nuvo, Statuario Maximus.' },
          { name: 'Butcher Block Island', notes: 'Maple or walnut. Warm contrast to stone perimeter counters. Needs periodic oiling.' },
        ],
      },
      {
        title: 'Cabinetry',
        options: [
          { name: 'Shaker White', notes: 'Painted MDF or maple. Timeless profile, works with any hardware. Soft-close standard.' },
          { name: 'Flat-Panel Walnut', notes: 'Slab doors with integrated pulls. Warm wood tone, no visible hardware.' },
        ],
      },
      {
        title: 'Backsplash',
        options: [
          { name: 'Subway Tile 3x6', notes: 'Classic white ceramic. Affordable, easy to source. Consider a colored grout for contrast.' },
          { name: 'Large-Format Porcelain', notes: '24x48 slabs, minimal grout lines. Modern look, easier to clean.' },
        ],
      },
      {
        title: 'Sink & Faucet',
        options: [
          { name: 'Undermount Stainless', notes: 'Single-bowl 30-32". Kraus or Ruvati. Pair with a pull-down faucet.' },
        ],
      },
      {
        title: 'Appliances - Range',
        options: [
          { name: '30" Gas Range', notes: 'Stainless finish. Consider: Samsung, LG, or Bosch for value; Wolf/Viking for pro-style.' },
        ],
      },
    ],
  },
  {
    id: 'kit-island-kitchen',
    label: 'Island Tropical Kitchen',
    description: 'Hawaii-inspired: natural stone, open shelving, and breezy finishes for island living.',
    author: 'hhc',
    roomTypes: ['kitchen'],
    decisionTitles: ['Countertop', 'Cabinetry', 'Backsplash', 'Flooring'],
    decisions: [
      {
        title: 'Countertop',
        options: [
          { name: 'Honed Granite', notes: 'Matte finish, heat-resistant. Colors: Absolute Black, Uba Tuba, or a local Hawaiian stone.' },
          { name: 'Concrete Countertop', notes: 'Custom-poured, can add pigment for color. Seal well in humid climate.' },
        ],
      },
      {
        title: 'Cabinetry',
        options: [
          { name: 'Open Shelving + Base Cabs', notes: 'Koa or bamboo shelves above, painted bases below. Great airflow, tropical feel.' },
        ],
      },
      {
        title: 'Backsplash',
        options: [
          { name: 'Hand-Painted Tile', notes: 'Locally sourced ceramic with botanical or ocean motifs. Unique, supports local artisans.' },
        ],
      },
      {
        title: 'Flooring',
        options: [
          { name: 'Porcelain Wood-Look', notes: 'Moisture-proof, no warping in humidity. Look for slip-rated options (R10+).' },
        ],
      },
    ],
  },

  // --- Bathroom Kits ---
  {
    id: 'kit-spa-bathroom',
    label: 'Spa Bathroom',
    description: 'Hotel-inspired: walk-in shower, floating vanity, and calming neutral palette.',
    author: 'hhc',
    roomTypes: ['bathroom'],
    decisionTitles: ['Vanity', 'Countertop', 'Shower/Tub', 'Floor Tile', 'Wall Tile', 'Fixtures'],
    decisions: [
      {
        title: 'Vanity',
        options: [
          { name: 'Floating Double Vanity', notes: '60" wall-mounted, walnut or white oak. Soft-close drawers, integrated lighting below.' },
        ],
      },
      {
        title: 'Countertop',
        options: [
          { name: 'Quartz Slab', notes: 'Undermount rectangular sinks. Calacatta or Carrara look. Integrated backsplash.' },
        ],
      },
      {
        title: 'Shower/Tub',
        options: [
          { name: 'Curbless Walk-In Shower', notes: 'Linear drain, glass panel. Minimum 48x36". Bench niche built-in.' },
          { name: 'Freestanding Soaker Tub', notes: 'Acrylic, 60-66". Floor-mounted filler. Requires dedicated drain location.' },
        ],
      },
      {
        title: 'Floor Tile',
        options: [
          { name: 'Large Format Matte Porcelain', notes: '12x24 or 24x24, light gray or warm white. Fewer grout lines, spa feel.' },
        ],
      },
      {
        title: 'Wall Tile',
        options: [
          { name: 'Floor-to-Ceiling Tile', notes: 'Match floor tile on walls for seamless look. Accent niche in contrasting mosaic.' },
        ],
      },
      {
        title: 'Fixtures',
        options: [
          { name: 'Matte Black Set', notes: 'Showerhead, valve, towel bars, TP holder. Kohler Purist or Delta Trinsic lines.' },
          { name: 'Brushed Gold Set', notes: 'Warm metallic finish. Pairs well with white tile and wood vanity.' },
        ],
      },
    ],
  },

  // --- Living Room Kit ---
  {
    id: 'kit-coastal-living',
    label: 'Coastal Living Room',
    description: 'Light, airy, and relaxed. Natural materials with ocean-inspired accents.',
    author: 'hhc',
    roomTypes: ['living_room'],
    decisionTitles: ['Flooring', 'Paint', 'Lighting', 'Window Treatments'],
    decisions: [
      {
        title: 'Flooring',
        options: [
          { name: 'Light Oak Engineered', notes: 'Wide plank (7"+), matte finish. Engineered better than solid for Hawaii humidity.' },
          { name: 'Luxury Vinyl Plank', notes: 'Waterproof, durable. Looks like wood but handles moisture and scratches. COREtec or Shaw.' },
        ],
      },
      {
        title: 'Paint',
        options: [
          { name: 'Warm White Walls', notes: 'Benjamin Moore Simply White or Swiss Coffee. Eggshell finish. Reflects natural light.' },
          { name: 'Accent: Sea Glass', notes: 'One accent wall in soft blue-green. Benjamin Moore Palladian Blue or Sherwin-Williams Rainwashed.' },
        ],
      },
      {
        title: 'Lighting',
        options: [
          { name: 'Rattan Pendant', notes: 'Natural woven fixture, 18-24" diameter. Great over seating area or entryway.' },
          { name: 'Recessed + Dimmers', notes: '4" LED slim recessed, spaced 4-6 ft apart. Add Lutron Caseta dimmers for mood control.' },
        ],
      },
      {
        title: 'Window Treatments',
        options: [
          { name: 'Sheer Linen Curtains', notes: 'Floor-length, white or natural. Let light in while softening glare. Rod-pocket or grommet.' },
          { name: 'Bamboo Roller Shades', notes: 'Light-filtering, natural texture. Complement with blackout liners for bedrooms.' },
        ],
      },
    ],
  },

  // --- Universal Flooring Kit ---
  {
    id: 'kit-hawaii-flooring',
    label: 'Hawaii-Ready Flooring',
    description: 'Moisture-resistant options that handle island humidity and look great.',
    author: 'hhc',
    roomTypes: ['flooring', 'kitchen', 'bathroom', 'living_room', 'bedroom', 'hallway', 'laundry_room'],
    decisionTitles: ['Flooring', 'Material Type', 'Floor Tile'],
    decisions: [
      {
        title: 'Flooring',
        options: [
          { name: 'Porcelain Wood-Look', notes: 'Zero moisture absorption, scratch-proof. Best for kitchens, baths, entries. Look for rectified edges.' },
          { name: 'Engineered Hardwood', notes: 'Real wood veneer over plywood core. Handles humidity better than solid. Acclimate 7+ days before install.' },
          { name: 'Luxury Vinyl Plank (LVP)', notes: 'Waterproof, quiet underfoot. Great value. Avoid direct sun exposure (thermal expansion).' },
        ],
      },
      {
        title: 'Material Type',
        options: [
          { name: 'Porcelain Wood-Look', notes: 'Best for wet areas and high-traffic. Zero maintenance beyond mopping.' },
          { name: 'Luxury Vinyl Plank', notes: 'Best value all-rounder. Waterproof, comfortable, easy DIY install.' },
        ],
      },
      {
        title: 'Floor Tile',
        options: [
          { name: 'Large Format Porcelain', notes: '12x24 or 24x24. Fewer grout lines, cleaner look. Rectified edges for tight joints.' },
          { name: 'Patterned Cement Tile', notes: 'Handmade, bold patterns. Seal well. Great for a statement floor in bath or entry.' },
        ],
      },
    ],
  },
]
