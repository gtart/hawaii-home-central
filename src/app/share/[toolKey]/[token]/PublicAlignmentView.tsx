'use client'

import { useState } from 'react'
import type { PublicAlignmentItem } from '@/data/alignment'

interface Props {
  payload: Record<string, unknown>
  projectName: string
  token: string
  allowResponses: boolean
}

export function PublicAlignmentView({ payload, projectName, token, allowResponses }: Props) {
  const items = (Array.isArray(payload.items) ? payload.items : []) as PublicAlignmentItem[]
  const activeItems = items.filter((i) => !i.superseded)
  const supersededItems = items.filter((i) => i.superseded)

  return (
    <div className="min-h-screen bg-basalt">
      {/* Header */}
      <div className="bg-basalt border-b border-cream/10 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-cream/30 mb-1">Shared from Hawaii Home Central</p>
          <h1 className="font-serif text-2xl text-cream">{projectName} — Project Alignment</h1>
          <p className="text-sm text-cream/40 mt-1">
            {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} shared for your review
            {allowResponses && ' — you can respond to each item below'}
          </p>
          {allowResponses && (
            <p className="text-xs text-cream/25 mt-2">
              Your responses help resolve scope questions and mismatches. Each response is recorded with your name.
            </p>
          )}
        </div>
      </div>

      {/* Active Items */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {activeItems.length === 0 ? (
          <div className="text-center py-12 text-cream/30 text-sm">
            No items to display.
          </div>
        ) : (
          activeItems.map((item) => (
            <PublicAlignmentItemCard
              key={item.itemNumber}
              item={item}
              token={token}
              allowResponses={allowResponses}
            />
          ))
        )}

        {/* Superseded items — collapsed section */}
        {supersededItems.length > 0 && (
          <SupersededSection items={supersededItems} token={token} />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cream/10 px-6 py-6 text-center">
        <p className="text-xs text-cream/20">
          This is a shared view from Hawaii Home Central. This is not a legal document.
        </p>
      </div>
    </div>
  )
}

function SupersededSection({ items, token }: { items: PublicAlignmentItem[]; token: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-t border-cream/8 pt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-cream/25 hover:text-cream/40 transition-colors mb-4"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {items.length} superseded item{items.length !== 1 ? 's' : ''} (no longer current)
      </button>
      {isOpen && (
        <div className="space-y-4 opacity-60">
          {items.map((item) => (
            <PublicAlignmentItemCard
              key={item.itemNumber}
              item={item}
              token={token}
              allowResponses={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PublicAlignmentItemCard({
  item,
  token,
  allowResponses,
}: {
  item: PublicAlignmentItem
  token: string
  allowResponses: boolean
}) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const isSuperseded = item.superseded

  return (
    <div className={`rounded-xl border overflow-hidden ${isSuperseded ? 'border-cream/5 bg-basalt-50/50' : 'border-cream/10 bg-basalt-50'}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-cream/8">
        <div className="flex items-start gap-3">
          <span className="text-xs text-cream/30 font-mono mt-0.5">#{item.itemNumber}</span>
          <div className="flex-1">
            <h3 className={`text-base font-serif ${isSuperseded ? 'text-cream/50 line-through decoration-cream/20' : 'text-cream'}`}>{item.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-cream/50 bg-cream/5 px-2 py-0.5 rounded-full">{item.status.replace(/_/g, ' ')}</span>
              {item.area_label && <span className="text-[11px] text-cream/30">{item.area_label}</span>}
              {item.waiting_on_role !== 'none' && (
                <span className="text-[11px] text-cream/40">
                  Waiting on: <span className="text-cream/60">{item.waiting_on_role}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSuperseded && (
        <div className="px-5 py-2.5 bg-cream/[0.02] border-b border-cream/5">
          <p className="text-xs text-cream/30 italic">This item has been superseded by a newer version.</p>
        </div>
      )}

      {/* Agreed Answer */}
      {item.current_agreed_answer && (
        <div className="px-5 py-3 bg-emerald-400/5 border-b border-emerald-400/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/60 mb-1">Current Agreed Answer</p>
          <p className="text-sm text-cream leading-relaxed">{item.current_agreed_answer}</p>
          {item.answer_updated_at && (
            <p className="text-[10px] text-emerald-400/30 mt-1">
              Updated {new Date(item.answer_updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-cream/40 mb-1">Current Issue</p>
          <p className="text-sm text-cream/80 leading-relaxed whitespace-pre-wrap">{item.current_issue}</p>
        </div>
        {item.original_expectation && (
          <div>
            <p className="text-xs font-medium text-cream/40 mb-1">Original Expectation</p>
            <p className="text-sm text-cream/70 leading-relaxed whitespace-pre-wrap">{item.original_expectation}</p>
          </div>
        )}
        {item.proposed_resolution && (
          <div>
            <p className="text-xs font-medium text-cream/40 mb-1">Proposed Resolution</p>
            <p className="text-sm text-cream/70 leading-relaxed whitespace-pre-wrap">{item.proposed_resolution}</p>
          </div>
        )}

        {/* Scope Clarity */}
        {(item.what_changed || item.what_did_not_change || item.whats_still_open) && (
          <div className="border-t border-cream/8 pt-3 mt-3 space-y-2">
            <p className="text-xs font-medium text-cream/40">Scope Clarity</p>
            {item.what_changed && (
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-cream/40">Changed:</span>
                  <p className="text-sm text-cream/70">{item.what_changed}</p>
                </div>
              </div>
            )}
            {item.what_did_not_change && (
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-cream/40">Unchanged:</span>
                  <p className="text-sm text-cream/70">{item.what_did_not_change}</p>
                </div>
              </div>
            )}
            {item.whats_still_open && (
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-cream/40">Still open:</span>
                  <p className="text-sm text-cream/70">{item.whats_still_open}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cost / Schedule */}
        {(item.cost_impact_status !== 'none' || item.schedule_impact_status !== 'none') && (
          <div className="flex gap-4 text-xs text-cream/40">
            {item.cost_impact_status !== 'none' && (
              <span>Cost: {item.cost_impact_status}{item.cost_impact_amount_text ? ` (${item.cost_impact_amount_text})` : ''}</span>
            )}
            {item.schedule_impact_status !== 'none' && (
              <span>Schedule: {item.schedule_impact_status}{item.schedule_impact_text ? ` (${item.schedule_impact_text})` : ''}</span>
            )}
          </div>
        )}

        {/* Photos */}
        {item.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {item.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo.thumbnailUrl || photo.url}
                alt="Evidence"
                className="rounded-lg aspect-square object-cover border border-cream/8"
              />
            ))}
          </div>
        )}

        {/* Existing responses */}
        {item.guest_responses.length > 0 && (
          <div className="border-t border-cream/8 pt-3 mt-3">
            <p className="text-xs font-medium text-cream/40 mb-2">Previous Responses</p>
            {item.guest_responses.map((resp) => (
              <div key={resp.id} className="text-xs text-cream/50 mb-2 pl-3 border-l-2 border-cream/10">
                <span className="font-medium text-cream/60">{resp.respondent_name}</span>
                {resp.included_not_included_unsure && (
                  <span className="ml-1 text-cream/40">
                    ({resp.included_not_included_unsure === 'included' ? 'In scope' : resp.included_not_included_unsure === 'not_included' ? 'Not in scope' : 'Unsure'})
                  </span>
                )}
                {resp.suggested_resolution && <span> — {resp.suggested_resolution}</span>}
                {resp.note && <span> — {resp.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response form */}
      {allowResponses && !submitted && !isSuperseded && (
        <div className="px-5 py-4 border-t border-cream/8">
          {showResponseForm ? (
            <GuestResponseForm
              token={token}
              itemId={item.id}
              onSubmit={() => { setSubmitted(true); setShowResponseForm(false) }}
              onCancel={() => setShowResponseForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowResponseForm(true)}
              className="w-full py-2.5 rounded-lg border border-sandstone/20 text-sandstone/70 text-sm hover:bg-sandstone/5 transition-colors"
            >
              Respond to this item
            </button>
          )}
        </div>
      )}
      {submitted && (
        <div className="px-5 py-3 bg-emerald-400/5 border-t border-emerald-400/10 text-center">
          <p className="text-sm text-emerald-400/70">Response submitted. Thank you!</p>
        </div>
      )}
    </div>
  )
}

function GuestResponseForm({
  token,
  itemId,
  onSubmit,
  onCancel,
}: {
  token: string
  itemId: string
  onSubmit: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [understanding, setUnderstanding] = useState('')
  const [inclusion, setInclusion] = useState<'' | 'included' | 'not_included' | 'unsure'>('')
  const [costImpact, setCostImpact] = useState('')
  const [scheduleImpact, setScheduleImpact] = useState('')
  const [suggestedResolution, setSuggestedResolution] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/share/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          respondent_name: name.trim(),
          understanding_of_issue: understanding.trim() || undefined,
          included_not_included_unsure: inclusion || undefined,
          cost_impact: costImpact.trim() || undefined,
          schedule_impact: scheduleImpact.trim() || undefined,
          suggested_resolution: suggestedResolution.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to submit response. Please try again.')
        return
      }

      onSubmit()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-cream/40">Your Response</h4>
      <p className="text-[11px] text-cream/25">Share your perspective on this scope issue. Your name and response will be visible to the homeowner.</p>

      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Your Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Smith"
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Your understanding of the issue</label>
        <textarea
          value={understanding}
          onChange={(e) => setUnderstanding(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
        />
      </div>

      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Is this included in the current scope?</label>
        <select
          value={inclusion}
          onChange={(e) => setInclusion(e.target.value as typeof inclusion)}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
        >
          <option value="">— Select —</option>
          <option value="included">Included in scope</option>
          <option value="not_included">Not included in scope</option>
          <option value="unsure">Unsure</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">Cost impact</label>
          <input
            type="text"
            value={costImpact}
            onChange={(e) => setCostImpact(e.target.value)}
            placeholder="$0, $500, TBD..."
            className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
          />
        </div>
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">Schedule impact</label>
          <input
            type="text"
            value={scheduleImpact}
            onChange={(e) => setScheduleImpact(e.target.value)}
            placeholder="+2 days, none..."
            className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Suggested resolution</label>
        <textarea
          value={suggestedResolution}
          onChange={(e) => setSuggestedResolution(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
        />
      </div>

      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Additional notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-cream/40 hover:text-cream/60 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone/90 disabled:opacity-40 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </div>
    </form>
  )
}
