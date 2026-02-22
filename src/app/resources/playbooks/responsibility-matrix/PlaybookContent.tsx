'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SignInPill } from '@/components/auth/SignInPill'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
  RESPONSIBILITY_ITEMS,
  STAGES,
  type ResponsibilityItemData,
} from '@/data/responsibility-matrix'

function ReadOnlyItem({ item }: { item: ResponsibilityItemData }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-basalt-50 rounded-card p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <p className="text-cream/80 text-sm font-medium">{item.category}</p>
        {item.variance === 'high' && (
          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-sandstone/20 text-sandstone">
            High variance
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-cream/50 mb-2">
        <span>Often:</span>
        <span className="text-cream/70 font-medium">{item.oftenOwner}</span>
      </div>

      <p className="text-cream/60 text-sm leading-relaxed italic">
        &ldquo;{item.clarifyQuestion}&rdquo;
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="text-sandstone/60 text-xs mt-3 hover:text-sandstone transition-colors cursor-pointer"
      >
        {open ? 'Hide detail ▲' : 'More detail ▼'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm border-t border-cream/5 pt-3">
          <div>
            <span className="text-cream/50 font-medium text-xs">Ownership includes:</span>
            <ul className="mt-1 space-y-1">
              {item.includes.map((inc) => (
                <li key={inc} className="text-cream/60 text-xs flex gap-2">
                  <span className="text-sandstone/50">&bull;</span>
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-cream/50 font-medium text-xs">Common mismatch: </span>
            <span className="text-cream/60 text-xs">{item.commonMismatch}</span>
          </div>
        </div>
      )}

      {item.variance === 'high' && (
        <div className="mt-3 bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
          <p className="text-sandstone/90 text-xs font-medium mb-1">
            Why this varies locally
          </p>
          <p className="text-cream/60 text-xs leading-relaxed">
            {item.commonMismatch} Common in Hawai&#x02BB;i where contractor
            availability is limited and relationships tend to be longer-term,
            making informal handoff assumptions more common.
          </p>
        </div>
      )}
    </div>
  )
}

export function PlaybookContent() {
  const { data: session, status } = useSession()
  const [highVarianceOnly, setHighVarianceOnly] = useState(false)

  const itemsByStage = STAGES.map((stage) => ({
    stage,
    items: RESPONSIBILITY_ITEMS.filter((item) => item.stage === stage),
  }))

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: 'Guides', href: '/resources' }, { label: 'Who Handles What' }]} />

        {/* Hero */}
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-2">
          Who Handles What
        </h1>
        <p className="text-cream/70 text-lg mb-4 leading-relaxed">
          Prevent tasks from falling between trades&mdash;by making &lsquo;who does what&rsquo; clear before work starts.
        </p>
        <p className="text-cream/60 text-sm mb-8 leading-relaxed">
          Not a contract&mdash;just a clarity baseline to confirm handoffs.
        </p>

        {/* How to use this in Hawaii */}
        <div className="bg-basalt-50 rounded-card p-6 mb-10">
          <h2 className="font-serif text-xl text-sandstone mb-4">
            How to Use This in Hawai&#x02BB;i
          </h2>
          <p className="text-cream/60 text-sm leading-relaxed">
            Responsibility clarity matters more when the contractor pool is
            smaller and working relationships tend to be stronger, like here
            in Hawai&#x02BB;i. Use this sheet before the work starts. Walk
            through each item with your contractor and agree who owns what.
            The &ldquo;Often&rdquo; column shows the typical owner, but every
            project is different.
          </p>
        </div>

        {/* Sign-in pill */}
        <div className="mb-8">
          <SignInPill appToolPath="/app/tools/before-you-sign?tab=handoffs" label="Sign in to use Tools and assign owners in your workspace" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-cream/40 text-xs">Filter:</span>
          <button
            onClick={() => setHighVarianceOnly(!highVarianceOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              highVarianceOnly
                ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                : 'border-cream/20 text-cream/50 hover:border-cream/40'
            }`}
          >
            High variance only
          </button>
        </div>

        {/* Full item list grouped by stage */}
        <div className="space-y-10">
          {itemsByStage.map(({ stage, items }) => {
            const filtered = highVarianceOnly
              ? items.filter((i) => i.variance === 'high')
              : items
            if (filtered.length === 0) return null
            return (
              <section key={stage}>
                <h2 className="font-serif text-2xl text-cream mb-1">{stage}</h2>
                <p className="text-cream/50 text-sm mb-5">
                  {filtered.length} item{filtered.length !== 1 && 's'}
                  {!highVarianceOnly && (
                    <> &middot; {items.filter((i) => i.variance === 'high').length} high-variance</>
                  )}
                </p>

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
                You&apos;re signed in. Assign owners interactively.
              </p>
              <Link href="/app/tools/before-you-sign?tab=handoffs">
                <Button size="lg" className="w-full sm:w-auto">
                  Open interactive tool &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Use Tools to assign owners
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to assign owners for each item, add notes documenting
                your agreements, and access your saved workspace from any device.
              </p>
              <Button
                onClick={() => signIn('google', { callbackUrl: '/app/tools/before-you-sign?tab=handoffs' })}
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
