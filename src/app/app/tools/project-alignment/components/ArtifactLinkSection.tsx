'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AlignmentItem, AlignmentArtifactLink, ArtifactType, RelationshipType } from '@/data/alignment'
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

/** Build an in-app URL for a linked artifact, or null if not navigable. */
function buildLinkHref(link: AlignmentArtifactLink): string | null {
  if (link.url) return null // external links use <a> with href directly
  if (!link.collection_id || !link.entity_id) return null
  if (link.artifact_type === 'selection') {
    return `/app/tools/finish-decisions/decision/${link.entity_id}`
  }
  if (link.artifact_type === 'fix_item') {
    return `/app/tools/punchlist/${link.collection_id}?itemId=${link.entity_id}`
  }
  return null
}

/** Renders the label for a link — either a clickable deep-link or plain text. */
function LinkLabel({ link, className }: { link: AlignmentArtifactLink; className: string }) {
  const inAppHref = buildLinkHref(link)
  if (link.url) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className={`${className} hover:opacity-80 transition-opacity truncate flex-1`}>
        {link.entity_label}
      </a>
    )
  }
  if (inAppHref) {
    return (
      <Link href={inAppHref} className={`${className} hover:opacity-80 transition-opacity truncate flex-1`}>
        {link.entity_label}
      </Link>
    )
  }
  return <span className={`${className} truncate flex-1`}>{link.entity_label}</span>
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
              <LinkLabel link={link} className="text-sm text-blue-400/70" />
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
              <LinkLabel link={link} className="text-sm text-cream/70" />
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

/** Lightweight entity summary fetched from project collections. */
interface PickableEntity {
  id: string
  label: string
  collectionId: string
  collectionName: string
}

/** Fetches selections or fix items from the project's collections for the entity picker. */
function useProjectEntities(projectId: string | undefined | null, artifactType: ArtifactType) {
  const [entities, setEntities] = useState<PickableEntity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    const toolKey = artifactType === 'selection' ? 'finish_decisions' : artifactType === 'fix_item' ? 'punchlist' : null
    if (!toolKey) { setEntities([]); return }

    let cancelled = false
    setLoading(true)

    fetch(`/api/collections?projectId=${projectId}&toolKey=${toolKey}`)
      .then((r) => r.ok ? r.json() : null)
      .then(async (data) => {
        if (cancelled || !data?.collections) return
        const items: PickableEntity[] = []
        for (const coll of data.collections as { id: string; name: string }[]) {
          try {
            const res = await fetch(`/api/collections/${coll.id}`)
            if (!res.ok || cancelled) continue
            const collData = await res.json()
            const payload = collData.payload
            if (!payload) continue
            if (toolKey === 'finish_decisions') {
              const selections = payload.selections ?? payload.rooms ?? []
              for (const s of selections) {
                if (s.id && s.title) items.push({ id: s.id, label: s.title, collectionId: coll.id, collectionName: coll.name })
              }
            } else if (toolKey === 'punchlist') {
              for (const it of payload.items ?? []) {
                if (it.id && it.title) items.push({ id: it.id, label: it.title, collectionId: coll.id, collectionName: coll.name })
              }
            }
          } catch { /* ignore */ }
        }
        if (!cancelled) setEntities(items)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, artifactType])

  return { entities, loading }
}

function AddLinkForm({ item, api, onClose }: { item: AlignmentItem; api: AlignmentStateAPI; onClose: () => void }) {
  const [artifactType, setArtifactType] = useState<ArtifactType>('selection')
  const [relationship, setRelationship] = useState<RelationshipType>('references')
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [search, setSearch] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<PickableEntity | null>(null)

  const isPickable = artifactType === 'selection' || artifactType === 'fix_item'
  const { entities, loading } = useProjectEntities(isPickable ? api.projectId : null, artifactType)

  const filteredEntities = search.trim()
    ? entities.filter((e) => e.label.toLowerCase().includes(search.toLowerCase()))
    : entities

  const canSubmit = isPickable ? selectedEntity !== null : label.trim().length > 0

  // Reset selection when type changes
  function handleTypeChange(newType: ArtifactType) {
    setArtifactType(newType)
    setSelectedEntity(null)
    setLabel('')
    setSearch('')
  }

  function handleEntitySelect(entity: PickableEntity) {
    setSelectedEntity(entity)
    setLabel(entity.label)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    api.addArtifactLink(item.id, {
      artifact_type: artifactType,
      relationship,
      entity_label: label.trim(),
      entity_id: selectedEntity?.id,
      tool_key: artifactType === 'selection' ? 'finish_decisions' : artifactType === 'fix_item' ? 'punchlist' : undefined,
      collection_id: selectedEntity?.collectionId,
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
            onChange={(e) => handleTypeChange(e.target.value as ArtifactType)}
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

      {/* Entity picker for selections / fix items */}
      {isPickable && (
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">
            {artifactType === 'selection' ? 'Pick a Selection' : 'Pick a Fix Item'}
          </label>
          {selectedEntity ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sandstone/5 border border-sandstone/15">
              <span className="text-sm text-cream/80 truncate flex-1">{selectedEntity.label}</span>
              <span className="text-[10px] text-cream/25 shrink-0">{selectedEntity.collectionName}</span>
              <button
                type="button"
                onClick={() => { setSelectedEntity(null); setLabel('') }}
                className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={loading ? 'Loading...' : `Search ${artifactType === 'selection' ? 'selections' : 'fix items'}...`}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none"
                autoFocus
              />
              {!loading && filteredEntities.length > 0 && (
                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-cream/8 bg-basalt divide-y divide-cream/5">
                  {filteredEntities.slice(0, 20).map((entity) => (
                    <button
                      key={`${entity.collectionId}-${entity.id}`}
                      type="button"
                      onClick={() => handleEntitySelect(entity)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-cream/5 transition-colors"
                    >
                      <span className="text-sm text-cream/70 truncate flex-1">{entity.label}</span>
                      <span className="text-[10px] text-cream/20 shrink-0">{entity.collectionName}</span>
                    </button>
                  ))}
                  {filteredEntities.length > 20 && (
                    <div className="px-3 py-1.5 text-[10px] text-cream/20">
                      +{filteredEntities.length - 20} more — refine your search
                    </div>
                  )}
                </div>
              )}
              {!loading && entities.length === 0 && (
                <p className="text-[10px] text-cream/25 mt-1">
                  No {artifactType === 'selection' ? 'selections' : 'fix items'} found in this project.
                </p>
              )}
              {!loading && search && filteredEntities.length === 0 && entities.length > 0 && (
                <p className="text-[10px] text-cream/25 mt-1">No matches. Try a different search.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual label for external links, rooms, etc. */}
      {!isPickable && (
        <div>
          <label className="block text-[11px] text-cream/30 mb-1">Label *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={artifactType === 'external_link' ? 'e.g. Contract addendum PDF' : 'e.g. Kitchen, Master Bath'}
            className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none"
            autoFocus
          />
        </div>
      )}
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
