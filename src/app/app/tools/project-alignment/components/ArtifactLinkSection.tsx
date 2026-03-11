'use client'

import { useState } from 'react'
import type { AlignmentItem, ArtifactType, RelationshipType } from '@/data/alignment'
import type { AlignmentStateAPI } from '../useAlignmentState'

interface Props {
  item: AlignmentItem
  api: AlignmentStateAPI
}

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  selection: 'Selection',
  fix_item: 'Fix Item',
  external_link: 'External Link',
  room: 'Room / Area',
  document: 'Document',
  plan: 'Plan',
  photo: 'Photo',
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  references: 'References',
  affects: 'Affects',
  supersedes: 'Supersedes',
  source_of_truth: 'Source of Truth',
}

export function ArtifactLinkSection({ item, api }: Props) {
  const { readOnly } = api
  const [showAdd, setShowAdd] = useState(false)

  // Separate source_of_truth links (surfaced in detail view header) from regular links
  const regularLinks = item.artifact_links.filter((l) => l.relationship !== 'source_of_truth')
  const sotLinks = item.artifact_links.filter((l) => l.relationship === 'source_of_truth')

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-cream/40">
          Related Artifacts {item.artifact_links.length > 0 && `(${item.artifact_links.length})`}
        </h3>
        {!readOnly && !showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-[10px] text-sandstone/60 hover:text-sandstone transition-colors"
          >
            + Add Link
          </button>
        )}
      </div>

      {/* Source-of-truth links shown inline here too (they're also surfaced in detail header) */}
      {sotLinks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {sotLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-400/5 border border-blue-400/10 group">
              <span className="text-[10px] text-blue-400/50 bg-blue-400/10 px-1.5 py-0.5 rounded font-medium">
                Source of Truth
              </span>
              <span className="text-[10px] text-cream/25">{ARTIFACT_TYPE_LABELS[link.artifact_type]}</span>
              {link.url ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400/70 hover:text-blue-400 transition-colors truncate flex-1"
                >
                  {link.entity_label}
                </a>
              ) : (
                <span className="text-sm text-cream/70 truncate flex-1">{link.entity_label}</span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => api.removeArtifactLink(item.id, link.id)}
                  className="opacity-0 group-hover:opacity-100 text-cream/20 hover:text-red-400 transition-all shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Regular links */}
      {regularLinks.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {regularLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-basalt-50 border border-cream/8 group">
              <span className="text-[10px] text-cream/30 bg-cream/5 px-1.5 py-0.5 rounded">
                {ARTIFACT_TYPE_LABELS[link.artifact_type]}
              </span>
              <span className="text-[10px] text-cream/25">{RELATIONSHIP_LABELS[link.relationship]}</span>
              {link.url ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sandstone/70 hover:text-sandstone transition-colors truncate flex-1"
                >
                  {link.entity_label}
                </a>
              ) : (
                <span className="text-sm text-cream/70 truncate flex-1">{link.entity_label}</span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => api.removeArtifactLink(item.id, link.id)}
                  className="opacity-0 group-hover:opacity-100 text-cream/20 hover:text-red-400 transition-all shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {item.artifact_links.length === 0 && !showAdd && (
        <p className="text-xs text-cream/20 mb-2">No linked artifacts yet.</p>
      )}

      {/* Add link form */}
      {showAdd && <AddLinkForm item={item} api={api} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function AddLinkForm({ item, api, onClose }: { item: AlignmentItem; api: AlignmentStateAPI; onClose: () => void }) {
  const [artifactType, setArtifactType] = useState<ArtifactType>('external_link')
  const [relationship, setRelationship] = useState<RelationshipType>('references')
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const canSubmit = label.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    api.addArtifactLink(item.id, {
      artifact_type: artifactType,
      relationship,
      entity_label: label.trim(),
      url: artifactType === 'external_link' ? url.trim() || undefined : undefined,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-cream/10 bg-basalt-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">Type</label>
          <select
            value={artifactType}
            onChange={(e) => setArtifactType(e.target.value as ArtifactType)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none"
          >
            <option value="selection">Selection</option>
            <option value="fix_item">Fix Item</option>
            <option value="external_link">External Link</option>
            <option value="room">Room / Area</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">Relationship</label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none"
          >
            {Object.entries(RELATIONSHIP_LABELS).map(([key, lbl]) => (
              <option key={key} value={key}>{lbl}</option>
            ))}
          </select>
        </div>
      </div>
      {relationship === 'source_of_truth' && (
        <p className="text-[10px] text-blue-400/50 -mt-1">
          Source of Truth links are shown prominently at the top of the item detail view.
        </p>
      )}
      <div>
        <label className="block text-[11px] text-cream/30 mb-1">Label *</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Kitchen countertop selection"
          className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none"
          autoFocus
        />
      </div>
      {artifactType === 'external_link' && (
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none"
          />
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-cream/40 hover:text-cream/60 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sandstone text-basalt hover:bg-sandstone/90 disabled:opacity-40 transition-colors"
        >
          Add Link
        </button>
      </div>
    </form>
  )
}
