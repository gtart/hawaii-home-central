'use client'

import { useState } from 'react'
import type { AlignmentItemType, AlignmentArtifactLink, WaitingOnRole } from '@/data/alignment'
import type { AlignmentStateAPI } from '../useAlignmentState'
import { TYPE_CONFIG, WAITING_ON_CONFIG } from '../constants'

/** Pre-populated artifact link to attach on creation (e.g. from Fix Item / Selection detail). */
export interface InitialArtifactLink {
  artifact_type: AlignmentArtifactLink['artifact_type']
  relationship: AlignmentArtifactLink['relationship']
  entity_label: string
  entity_id?: string
  tool_key?: string
  collection_id?: string
}

interface Props {
  api: AlignmentStateAPI
  onClose: () => void
  onCreated?: (id: string) => void
  /** Pre-fill title */
  initialTitle?: string
  /** Pre-fill current issue */
  initialIssue?: string
  /** Auto-attach an artifact link on creation */
  initialLink?: InitialArtifactLink
}

export function AlignmentCreateForm({ api, onClose, onCreated, initialTitle, initialIssue, initialLink }: Props) {
  const [title, setTitle] = useState(initialTitle || '')
  const [currentIssue, setCurrentIssue] = useState(initialIssue || '')
  const [type, setType] = useState<AlignmentItemType>('open_question')
  const [areaLabel, setAreaLabel] = useState('')
  const [waitingOn, setWaitingOn] = useState<WaitingOnRole>('none')
  const [showMore, setShowMore] = useState(false)
  const [originalExpectation, setOriginalExpectation] = useState('')
  const [proposedResolution, setProposedResolution] = useState('')

  const canSubmit = title.trim().length > 0 && currentIssue.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const id = api.addItem({
      title: title.trim(),
      current_issue: currentIssue.trim(),
      type,
      area_label: areaLabel.trim(),
      waiting_on_role: waitingOn,
      original_expectation: originalExpectation.trim(),
      proposed_resolution: proposedResolution.trim(),
    })
    // Auto-attach pre-populated artifact link (e.g. from Fix Item / Selection detail)
    if (initialLink) {
      api.addArtifactLink(id, {
        artifact_type: initialLink.artifact_type,
        relationship: initialLink.relationship,
        entity_label: initialLink.entity_label,
        entity_id: initialLink.entity_id,
        tool_key: initialLink.tool_key,
        collection_id: initialLink.collection_id,
      })
    }
    onCreated?.(id)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-basalt-50 border border-cream/8 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-lg text-cream">New Alignment Item</h3>
        <button type="button" onClick={onClose} className="text-cream/30 hover:text-cream/60 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-cream/40 -mt-2">
        What&apos;s unclear, what changed, or where do you and your contractor disagree?
      </p>

      {/* Pre-linked artifact indicator */}
      {initialLink && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/10">
          <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] text-amber-400/70">
            Will link to: <span className="text-cream/60 font-medium">{initialLink.entity_label}</span>
          </span>
        </div>
      )}

      {/* Title — required */}
      <div>
        <label className="block text-xs font-medium text-cream/50 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Kitchen backsplash tile scope"'
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
          autoFocus
        />
      </div>

      {/* Current Issue — required */}
      <div>
        <label className="block text-xs font-medium text-cream/50 mb-1">Current Issue *</label>
        <textarea
          value={currentIssue}
          onChange={(e) => setCurrentIssue(e.target.value)}
          placeholder="Describe the mismatch, ambiguity, or disagreement..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
        />
      </div>

      {/* Type + Area + Waiting On — optional but visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-cream/50 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlignmentItemType)}
            className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
          >
            {(Object.entries(TYPE_CONFIG) as [AlignmentItemType, { label: string }][]).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-cream/50 mb-1">Area</label>
          <input
            type="text"
            value={areaLabel}
            onChange={(e) => setAreaLabel(e.target.value)}
            placeholder="Kitchen, Master Bath..."
            className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-cream/50 mb-1">Waiting On</label>
          <select
            value={waitingOn}
            onChange={(e) => setWaitingOn(e.target.value as WaitingOnRole)}
            className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
          >
            {(Object.entries(WAITING_ON_CONFIG) as [WaitingOnRole, { label: string }][]).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progressive disclosure */}
      {!showMore && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="text-xs text-sandstone/60 hover:text-sandstone transition-colors"
        >
          + Add original expectation, proposed resolution...
        </button>
      )}

      {showMore && (
        <>
          <div>
            <label className="block text-xs font-medium text-cream/50 mb-1">Original Expectation</label>
            <textarea
              value={originalExpectation}
              onChange={(e) => setOriginalExpectation(e.target.value)}
              placeholder="What was originally understood or agreed?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/50 mb-1">Proposed Resolution</label>
            <textarea
              value={proposedResolution}
              onChange={(e) => setProposedResolution(e.target.value)}
              placeholder="What do you think should happen?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-cream/50 hover:text-cream/70 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Create Item
        </button>
      </div>
    </form>
  )
}
