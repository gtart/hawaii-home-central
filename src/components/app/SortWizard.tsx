'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'

type ToolKey = 'finish_decisions' | 'punchlist' | 'mood_boards'
type WizardStep = 'tool' | 'collection' | 'decision' | 'confirm'

interface CapturedItemSummary {
  id: string
  type: string
  title?: string | null
  note?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
}

interface CollectionOption {
  id: string
  title: string
}

interface DecisionOption {
  id: string
  title: string
  roomTitle: string
}

interface SortWizardProps {
  item: CapturedItemSummary
  onClose: () => void
  onSorted: () => void
}

const TOOL_OPTIONS: { key: ToolKey; label: string; description: string }[] = [
  { key: 'finish_decisions', label: 'Selections', description: 'Add as an option to a selection' },
  { key: 'punchlist', label: 'Fix List', description: 'Add as a fix item' },
  { key: 'mood_boards', label: 'Mood Boards', description: 'Add as an inspiration idea' },
]

export function SortWizard({ item, onClose, onSorted }: SortWizardProps) {
  const { currentProject } = useProject()
  const [step, setStep] = useState<WizardStep>('tool')
  const [toolKey, setToolKey] = useState<ToolKey | null>(null)
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [decisions, setDecisions] = useState<DecisionOption[]>([])
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [decisionTitle, setDecisionTitle] = useState('')
  const [title, setTitle] = useState(item.title || item.note || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortSuccess, setSortSuccess] = useState(false)

  const projectId = currentProject?.id

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Fetch collections when tool is selected
  useEffect(() => {
    if (!toolKey || !projectId) return
    setLoading(true)
    setError('')
    fetch(`/api/collections?projectId=${projectId}&toolKey=${toolKey}`)
      .then((res) => res.json())
      .then((data) => {
        const colls = (data.collections || []).map((c: { id: string; title: string }) => ({
          id: c.id,
          title: c.title,
        }))
        setCollections(colls)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load lists')
        setLoading(false)
      })
  }, [toolKey, projectId])

  // Fetch decisions when collection is selected (finish_decisions only)
  useEffect(() => {
    if (toolKey !== 'finish_decisions' || !collectionId) return
    setLoading(true)
    setError('')
    fetch(`/api/collections/${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        const payload = data.payload as Record<string, unknown>
        const rooms = (payload?.rooms || []) as Array<{
          title?: string
          decisions?: Array<{ id: string; title?: string }>
        }>
        const decs: DecisionOption[] = []
        for (const room of rooms) {
          for (const dec of room.decisions || []) {
            decs.push({
              id: dec.id,
              title: dec.title || 'Untitled',
              roomTitle: room.title || 'Untitled Room',
            })
          }
        }
        setDecisions(decs)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load selections')
        setLoading(false)
      })
  }, [toolKey, collectionId])

  function handleToolSelect(key: ToolKey) {
    setToolKey(key)
    setCollectionId(null)
    setDecisionId(null)
    setCollections([])
    setDecisions([])
    setError('')
    setStep('collection')
  }

  function handleCollectionSelect(id: string, cTitle: string) {
    setCollectionId(id)
    setCollectionTitle(cTitle)
    setError('')
    if (toolKey === 'finish_decisions') {
      setStep('decision')
    } else {
      setStep('confirm')
    }
  }

  function handleDecisionSelect(id: string, dTitle: string) {
    setDecisionId(id)
    setDecisionTitle(dTitle)
    setError('')
    setStep('confirm')
  }

  function handleBack() {
    setError('')
    if (step === 'confirm') {
      if (toolKey === 'finish_decisions' && decisionId) {
        setDecisionId(null)
        setStep('decision')
      } else {
        setCollectionId(null)
        setStep('collection')
      }
    } else if (step === 'decision') {
      setCollectionId(null)
      setStep('collection')
    } else if (step === 'collection') {
      setToolKey(null)
      setStep('tool')
    }
  }

  async function handleSort() {
    if (!toolKey || !collectionId) return
    if (toolKey === 'finish_decisions' && !decisionId) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/captured-items/${item.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolKey,
          collectionId,
          decisionId: decisionId || undefined,
          title: title.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Sort failed')
      }

      setSortSuccess(true)
      setTimeout(() => {
        onSorted()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sort failed')
      setLoading(false)
    }
  }

  const toolLabel = TOOL_OPTIONS.find((t) => t.key === toolKey)?.label || ''

  // Build destination summary
  let destinationSummary = ''
  if (toolKey && collectionTitle) {
    destinationSummary = `${toolLabel}: ${collectionTitle}`
    if (decisionTitle) {
      destinationSummary += ` → ${decisionTitle}`
    }
  }

  const content = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'tool' && !sortSuccess && (
              <button
                type="button"
                onClick={handleBack}
                className="text-cream/40 hover:text-cream transition-colors -ml-1 p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-medium text-cream">
              {sortSuccess ? 'Sorted' : step === 'tool' ? 'Sort to...' : step === 'collection' ? `Choose ${toolLabel} list` : step === 'decision' ? 'Choose selection' : 'Confirm'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* Success state */}
        {sortSuccess && (
          <div className="flex flex-col items-center gap-3 py-6">
            <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-cream/60">
              Added to {destinationSummary}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && !sortSuccess && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-cream/20 border-t-sandstone rounded-full animate-spin" />
            <span className="text-sm text-cream/50">
              {step === 'confirm' ? 'Sorting...' : 'Loading...'}
            </span>
          </div>
        )}

        {/* Step 1: Choose tool */}
        {step === 'tool' && !loading && (
          <div className="space-y-2">
            {TOOL_OPTIONS.map((tool) => (
              <button
                key={tool.key}
                type="button"
                onClick={() => handleToolSelect(tool.key)}
                className="w-full flex items-center gap-3 p-3.5 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-sandstone/10 flex items-center justify-center shrink-0">
                  {tool.key === 'finish_decisions' && (
                    <svg className="w-5 h-5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" />
                      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {tool.key === 'punchlist' && (
                    <svg className="w-5 h-5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {tool.key === 'mood_boards' && (
                    <svg className="w-5 h-5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream font-medium">{tool.label}</p>
                  <p className="text-[11px] text-cream/35 mt-0.5">{tool.description}</p>
                </div>
                <svg className="w-4 h-4 text-cream/20 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Choose collection */}
        {step === 'collection' && !loading && (
          <div className="space-y-2">
            {collections.length === 0 && !error && (
              <p className="text-sm text-cream/40 text-center py-4">
                No {toolLabel} lists found. Create one first.
              </p>
            )}
            {collections.map((coll) => (
              <button
                key={coll.id}
                type="button"
                onClick={() => handleCollectionSelect(coll.id, coll.title)}
                className="w-full flex items-center justify-between p-3 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <span className="text-sm text-cream truncate">{coll.title}</span>
                <svg className="w-4 h-4 text-cream/20 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Choose decision (finish_decisions only) */}
        {step === 'decision' && !loading && (
          <div className="space-y-2">
            {decisions.length === 0 && !error && (
              <p className="text-sm text-cream/40 text-center py-4">
                No selections found in this list.
              </p>
            )}
            {decisions.map((dec) => (
              <button
                key={dec.id}
                type="button"
                onClick={() => handleDecisionSelect(dec.id, dec.title)}
                className="w-full flex items-center justify-between p-3 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm text-cream truncate">{dec.title}</p>
                  <p className="text-[11px] text-cream/30 mt-0.5 truncate">{dec.roomTitle}</p>
                </div>
                <svg className="w-4 h-4 text-cream/20 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && !loading && !sortSuccess && (
          <div>
            {/* Preview */}
            <div className="flex items-start gap-3 p-3 bg-cream/5 rounded-lg mb-4">
              {(item.thumbnailUrl || item.imageUrl) && (
                <img
                  src={item.thumbnailUrl || item.imageUrl || ''}
                  alt=""
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream truncate">{item.title || item.note || 'Captured item'}</p>
                <p className="text-[11px] text-cream/30 mt-0.5 truncate">{destinationSummary}</p>
              </div>
            </div>

            {/* Title override */}
            <div className="mb-4">
              <label className="text-[11px] text-cream/30 block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
                className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/40"
              />
            </div>

            {/* Sort button */}
            <button
              type="button"
              onClick={handleSort}
              className="w-full px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Sort to {toolLabel}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[56] items-center justify-center pointer-events-none">
        <div
          className="w-full max-w-md bg-basalt-50 border border-cream/10 rounded-xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/10 rounded-t-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-cream/15 rounded-full" />
        </div>
        {content}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  )
}
