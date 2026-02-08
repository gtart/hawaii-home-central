'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { ShareButton } from '@/components/resources/ShareButton'
import { Button } from '@/components/ui/Button'
import { HOLD_POINT_STAGES } from '@/data/hold-points'
import type { HoldPointItemData } from '@/data/hold-points'

function ReadOnlyItem({ item }: { item: HoldPointItemData }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-basalt-50 rounded-card p-5">
      <p className="text-sandstone/70 text-xs font-medium uppercase tracking-wider">
        {item.category}
      </p>
      <p className="text-cream/80 text-sm mt-2 leading-relaxed">
        {item.summary}
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="text-sandstone/60 text-xs mt-3 hover:text-sandstone transition-colors cursor-pointer"
      >
        {open ? 'Hide detail \u25B2' : 'More detail \u25BC'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm border-t border-cream/5 pt-3">
          <div>
            <span className="text-cream/50 font-medium">Why it matters: </span>
            <span className="text-cream/60">{item.why}</span>
          </div>
          <div>
            <span className="text-cream/50 font-medium">What it impacts: </span>
            <span className="text-cream/60">{item.impacts}</span>
          </div>
          <div>
            <span className="text-cream/50 font-medium">Ask your contractor: </span>
            <span className="text-cream/60">{item.ask}</span>
          </div>
        </div>
      )}

      {item.hawaiiCallout && (
        <div className="mt-3 bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
          <p className="text-sandstone/90 text-xs font-medium mb-1">
            Hawai&#x02BB;i reality
          </p>
          <p className="text-cream/60 text-xs leading-relaxed">
            {item.hawaiiCallout}
          </p>
        </div>
      )}
    </div>
  )
}

const REALITY_ITEMS = [
  { label: 'Shipping', text: '4\u20138 weeks and 15\u201330% above mainland prices' },
  { label: 'Materials', text: 'Salt air, UV, and humidity are hard on finishes. Plan accordingly' },
  { label: 'Permits', text: 'Vary by county. Budget extra time' },
  { label: 'Older homes', text: 'Termite damage, lead paint, undersized panels. Budget for surprises' },
  { label: 'Contingency', text: '10\u201315% is standard. In Hawai\u02BBi, lean higher' },
]

export function PlaybookContent() {
  const { data: session, status } = useSession()
  const [hawaiiOnly, setHawaiiOnly] = useState(false)

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-cream/40 mb-6" aria-label="Breadcrumb">
          <Link href="/resources" className="hover:text-cream/60 transition-colors">
            Tools &amp; Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-cream/60">Hold Points</span>
        </nav>

        {/* Hero */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Hold Points
          </h1>
          <div className="shrink-0 mt-2">
            <ShareButton title="Hold Points: Specs You Must Lock In By Stage — Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          The costliest renovation mistakes happen when decisions are made after
          construction moves on. This guide shows what must be locked in before
          each stage.
        </p>

        {/* Hawaii reality check — 2-col grid for scannability */}
        <div className="bg-basalt-50 rounded-card p-6 mb-10">
          <h2 className="font-serif text-xl text-sandstone mb-4">
            Hawai&#x02BB;i Reality Check
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {REALITY_ITEMS.map((item) => (
              <div key={item.label} className="flex gap-2 text-sm py-1">
                <span className="text-sandstone font-medium shrink-0 min-w-[5.5rem]">{item.label}</span>
                <span className="text-cream/60">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-cream/40 text-xs">Filter:</span>
          <button
            onClick={() => setHawaiiOnly(!hawaiiOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              hawaiiOnly
                ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                : 'border-cream/20 text-cream/50 hover:border-cream/40'
            }`}
          >
            Hawai&#x02BB;i callouts only
          </button>
        </div>

        {/* Full stage-by-stage content */}
        <div className="space-y-10">
          {HOLD_POINT_STAGES.map((stage) => {
            const filtered = hawaiiOnly
              ? stage.items.filter((i) => i.hawaiiCallout)
              : stage.items
            if (filtered.length === 0) return null
            return (
              <section key={stage.id}>
                <h2 className="font-serif text-2xl text-cream mb-1">
                  {stage.title}
                </h2>
                <p className="text-cream/50 text-sm mb-5">{stage.subtitle}</p>

                <div className="space-y-4">
                  {filtered.map((item) => (
                    <ReadOnlyItem key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Sign-in CTA */}
        <div className="bg-basalt-50 rounded-card p-8 mt-12">
          {status === 'loading' ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
            </div>
          ) : session?.user ? (
            <div className="text-center">
              <p className="text-cream/70 text-sm mb-4">
                You&apos;re signed in. Track your decisions interactively.
              </p>
              <Link href="/app/tools/hold-points">
                <Button size="lg" className="w-full sm:w-auto">
                  Open interactive tool &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Track your decisions interactively
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to check off items as you lock them in, add notes per
                decision, see your progress summary, and pick up on any device.
              </p>
              <Button
                onClick={() => signIn('google', { callbackUrl: '/app/tools/hold-points' })}
                variant="secondary"
                size="lg"
                className="inline-flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
              <p className="text-cream/30 text-xs mt-3">Free. No spam.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
