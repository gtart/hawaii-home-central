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

  return (
    <div className="min-h-screen bg-basalt">
      {/* Header */}
      <div className="bg-basalt border-b border-cream/10 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-cream/30 mb-1">Shared from Hawaii Home Central</p>
          <h1 className="font-serif text-2xl text-cream">{projectName} — Project Alignment</h1>
          <p className="text-sm text-cream/40 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} shared for your review
            {allowResponses && ' — you can respond below'}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-12 text-cream/30 text-sm">
            No items to display.
          </div>
        ) : (
          items.map((item) => (
            <PublicAlignmentItemCard
              key={item.itemNumber}
              item={item}
              token={token}
              allowResponses={allowResponses}
            />
          ))
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

  return (
    <div className="rounded-xl border border-cream/10 bg-basalt-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cream/8">
        <div className="flex items-start gap-3">
          <span className="text-xs text-cream/30 font-mono mt-0.5">#{item.itemNumber}</span>
          <div className="flex-1">
            <h3 className="text-base font-serif text-cream">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-cream/50 bg-cream/5 px-2 py-0.5 rounded-full">{item.status.replace(/_/g, ' ')}</span>
              {item.area_label && <span className="text-[11px] text-cream/30">{item.area_label}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Agreed Answer */}
      {item.current_agreed_answer && (
        <div className="px-5 py-3 bg-emerald-400/5 border-b border-emerald-400/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/60 mb-1">Current Agreed Answer</p>
          <p className="text-sm text-cream leading-relaxed">{item.current_agreed_answer}</p>
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
                {resp.suggested_resolution && <span> — {resp.suggested_resolution}</span>}
                {resp.note && <span> — {resp.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response form */}
      {allowResponses && !submitted && (
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

      <div className="grid grid-cols-2 gap-3">
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
