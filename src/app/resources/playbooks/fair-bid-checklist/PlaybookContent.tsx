'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { ShareButton } from '@/components/resources/ShareButton'
import { Button } from '@/components/ui/Button'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'
import type { ChecklistItemData } from '@/data/fair-bid-checklist'

function ReadOnlyItem({ item }: { item: ChecklistItemData }) {
  return (
    <div className="py-3 border-b border-cream/5 last:border-0">
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 mt-0.5 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
            item.priority === 'essential'
              ? 'bg-sandstone/20 text-sandstone'
              : 'bg-cream/10 text-cream/40'
          }`}
        >
          {item.priority === 'essential' ? 'Essential' : 'Nice to know'}
        </span>
      </div>
      <p className="text-cream/80 text-sm mt-2 leading-relaxed">
        {item.label}
      </p>
      <p className="text-cream/50 text-xs mt-1 leading-relaxed">
        {item.detail}
      </p>

      {item.hawaiiCallout && (
        <div className="mt-2 bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
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

type FilterMode = 'all' | 'essential' | 'hawaii'

export function PlaybookContent() {
  const { data: session, status } = useSession()
  const [filter, setFilter] = useState<FilterMode>('all')

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-cream/40 mb-6" aria-label="Breadcrumb">
          <Link href="/resources" className="hover:text-cream/60 transition-colors">
            Tools &amp; Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-cream/60">Fair Bid Checklist</span>
        </nav>

        {/* Hero */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Fair Bid Checklist
          </h1>
          <div className="shrink-0 mt-2">
            <ShareButton title="Fair Bid Checklist — Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Compare bids apples-to-apples. This checklist surfaces the gaps,
          exclusions, and assumptions that cause disputes&mdash;before you sign
          anything.
        </p>

        {/* Hawaii bid traps */}
        <div className="bg-basalt-50 rounded-card p-6 mb-10">
          <h2 className="font-serif text-xl text-sandstone mb-4">
            Hawai&#x02BB;i Bid Traps
          </h2>
          <p className="text-cream/50 text-xs mb-3">
            Common in Hawai&#x02BB;i bids that mainland guides don&rsquo;t cover:
          </p>
          <ul className="text-cream/60 space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="text-sandstone shrink-0">&bull;</span>
              <span>Material shipping adds 15&ndash;30% above mainland prices. Items can take 2&ndash;8 weeks. Confirm if the bid includes freight.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-sandstone shrink-0">&bull;</span>
              <span>Older homes (pre-1978) may contain lead paint, asbestos, or canec (sugarcane fiberboard). Abatement adds cost and requires licensed professionals.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-sandstone shrink-0">&bull;</span>
              <span>Larger deposits (above 10&ndash;15%) are sometimes requested to cover material pre-orders. Ask for an itemized breakdown.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-sandstone shrink-0">&bull;</span>
              <span>Termite damage is extremely common, especially in post-and-pier foundations. Budget for testing before demo begins.</span>
            </li>
          </ul>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-cream/40 text-xs">Filter:</span>
          {([
            { key: 'all' as FilterMode, label: 'All items' },
            { key: 'essential' as FilterMode, label: 'Essentials only' },
            { key: 'hawaii' as FilterMode, label: 'Hawai\u02BBi callouts' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(filter === opt.key ? 'all' : opt.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                filter === opt.key && opt.key !== 'all'
                  ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                  : filter === opt.key
                    ? 'border-cream/40 text-cream/70'
                    : 'border-cream/20 text-cream/50 hover:border-cream/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Full section-by-section content */}
        <div className="space-y-10">
          {CHECKLIST_SECTIONS.map((section) => {
            const filtered = section.items.filter((item) => {
              if (filter === 'essential') return item.priority === 'essential'
              if (filter === 'hawaii') return !!item.hawaiiCallout
              return true
            })
            if (filtered.length === 0) return null
            return (
              <section key={section.id}>
                <h2 className="font-serif text-2xl text-cream mb-1">
                  {section.title}
                </h2>
                <p className="text-cream/50 text-sm mb-5">{section.why}</p>

                <div className="bg-basalt-50 rounded-card p-5">
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
                You&apos;re signed in. Check items off interactively.
              </p>
              <Link href="/app/tools/fair-bid-checklist">
                <Button size="lg" className="w-full sm:w-auto">
                  Open interactive tool &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Check items off interactively
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to check off items as you review each bid, track your
                progress across essentials and nice-to-knows, and pick up on any
                device.
              </p>
              <Button
                onClick={() => signIn('google', { callbackUrl: '/app/tools/fair-bid-checklist' })}
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
