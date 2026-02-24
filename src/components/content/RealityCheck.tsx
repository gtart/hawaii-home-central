'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const BULLETS = [
  'Material shipping commonly adds 4\u20138 weeks and can cost 15\u201330% more than mainland prices.',
  'Salt air, UV, and humidity are hard on materials. Plan your finishes accordingly.',
  'Budget extra time for permitting. Processes, fees, and timelines vary by county.',
  'Older homes commonly have termite damage, lead paint, and undersized panels. Budget for surprises.',
  'A 10\u201315% contingency is common. In Hawai\u02BBi, plan for the higher end.',
]

export function RealityCheck() {
  const [open, setOpen] = useState<boolean | null>(null) // null = use default per breakpoint

  // Default: expanded on desktop, collapsed on mobile.
  // Once user clicks, their choice overrides.
  const isOpen = open

  return (
    <div className="bg-basalt-50 rounded-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => (prev === null ? false : !prev))}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
        aria-expanded={isOpen ?? undefined}
      >
        <h2 className="font-serif text-xl text-sandstone">
          Hawai&#x02BB;i Renovation Reality Check
        </h2>
        <svg
          className={cn(
            'w-4 h-4 text-cream/40 shrink-0 transition-transform',
            // Default: rotated on desktop (expanded), not on mobile (collapsed)
            isOpen === null
              ? 'md:rotate-180'
              : isOpen
                ? 'rotate-180'
                : ''
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen === null
            ? 'max-h-0 md:max-h-[500px]'
            : isOpen
              ? 'max-h-[500px]'
              : 'max-h-0'
        )}
      >
        <div className="px-5 pb-5">
          <ul className="text-cream/60 space-y-2 text-sm">
            {BULLETS.map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-sandstone shrink-0">&bull;</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-cream/30 mt-3">
            Timelines and costs vary by island, vendor, and project scope. Use
            this as planning guidance.
          </p>
        </div>
      </div>
    </div>
  )
}
