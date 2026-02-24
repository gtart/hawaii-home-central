'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryTag {
  id: string
  name: string
  slug: string
}

interface Props {
  primaryTags: PrimaryTag[]
  mobile?: boolean
}

const MAIN_SECTIONS = [
  { id: 'start-here', label: 'Start Here' },
  { id: 'reality-check', label: 'Reality Check' },
  { id: 'library', label: 'Library' },
]

function slugify(name: string) {
  return 'cat-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function TOCLinks({
  primaryTags,
  activeId,
  onClickLink,
}: {
  primaryTags: PrimaryTag[]
  activeId: string | null
  onClickLink?: () => void
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onClickLink?.()
  }

  const categoryAnchors = primaryTags.map((t) => ({
    id: slugify(t.name),
    label: t.name,
  }))

  return (
    <nav aria-label="Page contents">
      <p className="text-[10px] font-medium uppercase tracking-wide text-cream/30 mb-3">
        Contents
      </p>
      <ul className="space-y-1.5">
        {MAIN_SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => handleClick(e, s.id)}
              className={cn(
                'block text-sm transition-colors py-0.5',
                activeId === s.id
                  ? 'text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream/70'
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
        {categoryAnchors.length > 1 && (
          <>
            <li className="border-t border-cream/5 pt-1.5 mt-1.5">
              <span className="text-[10px] uppercase tracking-wide text-cream/20">
                Categories
              </span>
            </li>
            {categoryAnchors.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => handleClick(e, c.id)}
                  className={cn(
                    'block text-xs transition-colors py-0.5 pl-2',
                    activeId === c.id
                      ? 'text-sandstone'
                      : 'text-cream/40 hover:text-cream/60'
                  )}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </>
        )}
      </ul>
    </nav>
  )
}

export function ContentsTOC({ primaryTags, mobile }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Intersection observer to highlight active section
  const observe = useCallback(() => {
    const allIds = [
      ...MAIN_SECTIONS.map((s) => s.id),
      ...primaryTags.map((t) => slugify(t.name)),
    ]
    const elements = allIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [primaryTags])

  useEffect(() => {
    const cleanup = observe()
    return cleanup
  }, [observe])

  // Close mobile drawer on escape
  useEffect(() => {
    if (!mobileOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mobileOpen])

  if (mobile) {
    return (
      <>
        {/* Fixed bottom-right button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-basalt-50 border border-cream/15 rounded-full px-4 py-2.5 text-xs font-medium text-cream/70 shadow-lg hover:text-cream transition-colors"
          aria-label="Open table of contents"
        >
          Contents
        </button>

        {/* Drawer */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-basalt/70"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-basalt-50 rounded-t-2xl p-6 pb-10 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-cream/70">Contents</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-cream/40 hover:text-cream/60 p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TOCLinks
                primaryTags={primaryTags}
                activeId={activeId}
                onClickLink={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}
      </>
    )
  }

  // Desktop: sticky sidebar
  return (
    <div className="sticky top-32">
      <TOCLinks primaryTags={primaryTags} activeId={activeId} />
    </div>
  )
}
