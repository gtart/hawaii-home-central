'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { generateSlug } from '@/lib/slug'
import { ImagePanel } from '@/components/admin/ImagePanel'
import type { ContentWithRelations } from '@/types/content'

interface Collection {
  id: string
  title: string
  slug: string
}

interface RelatedItem {
  id: string
  title: string
  contentType: string
}

interface ContentEditorProps {
  initial?: ContentWithRelations
  defaultType?: 'GUIDE' | 'STORY'
}

export function ContentEditor({ initial, defaultType }: ContentEditorProps) {
  const router = useRouter()
  const isEdit = !!initial

  // Core fields
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initial)
  const [contentType, setContentType] = useState(
    initial?.contentType ?? defaultType ?? 'GUIDE'
  )
  const [dek, setDek] = useState(initial?.dek ?? '')
  const [bodyMd, setBodyMd] = useState(initial?.bodyMd ?? '')
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>(initial?.status ?? 'DRAFT')
  const [publishAt, setPublishAt] = useState(
    initial?.publishAt
      ? new Date(initial.publishAt).toISOString().slice(0, 16)
      : ''
  )
  const [authorName, setAuthorName] = useState(initial?.authorName ?? '')

  // SEO
  const [showSeo, setShowSeo] = useState(false)
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? ''
  )
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(initial?.ogImageUrl ?? '')
  const [robotsNoIndex, setRobotsNoIndex] = useState(
    initial?.robotsNoIndex ?? false
  )

  // Geo
  const [geoScope, setGeoScope] = useState(initial?.geoScope ?? '')
  const [geoPlace, setGeoPlace] = useState(initial?.geoPlace ?? '')

  // Tags
  const [tagsInput, setTagsInput] = useState('')

  // Primary tags (categories)
  interface PrimaryTag { id: string; name: string; slug: string }
  const [allPrimaryTags, setAllPrimaryTags] = useState<PrimaryTag[]>([])
  const [selectedPrimaryTagIds, setSelectedPrimaryTagIds] = useState<Set<string>>(new Set())
  const [newCategoryInput, setNewCategoryInput] = useState('')

  // Collections
  const [allCollections, setAllCollections] = useState<Collection[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    initial?.collectionItems?.map((ci) => ci.collectionId) ?? []
  )
  const [primaryCollectionId, setPrimaryCollectionId] = useState(
    initial?.primaryCollectionId ?? ''
  )

  // Related
  const [related, setRelated] = useState<RelatedItem[]>(
    initial?.relationsFrom?.map((r) => ({
      id: r.toContent.id,
      title: r.toContent.title,
      contentType: r.toContent.contentType,
    })) ?? []
  )
  const [relatedSearch, setRelatedSearch] = useState('')
  const [relatedResults, setRelatedResults] = useState<RelatedItem[]>([])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManual])

  // Load collections + primary tags
  useEffect(() => {
    fetch('/api/admin/collections')
      .then((r) => r.json())
      .then((data) => setAllCollections(data))
      .catch(() => {})
    fetch('/api/admin/tags')
      .then((r) => r.json())
      .then((data: { id: string; name: string; slug: string; isPrimary: boolean }[]) => {
        const primary = data
          .filter((t) => t.isPrimary)
          .map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
        setAllPrimaryTags(primary)

        // Split initial tags into primary vs regular
        if (initial?.tags) {
          const primarySlugs = new Set(primary.map((p) => p.slug))
          const primaryIds = new Set<string>()
          const regularNames: string[] = []

          for (const ct of initial.tags) {
            const tagSlug = ct.tag.name
              .toLowerCase()
              .replace(/['']/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
            const matchedPrimary = primary.find((p) => p.slug === tagSlug)
            if (matchedPrimary) {
              primaryIds.add(matchedPrimary.id)
            } else {
              regularNames.push(ct.tag.name)
            }
          }

          setSelectedPrimaryTagIds(primaryIds)
          setTagsInput(regularNames.join(', '))
        }
      })
      .catch(() => {})
  }, [])

  // Related content search
  useEffect(() => {
    if (relatedSearch.length < 2) {
      setRelatedResults([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/content/search?q=${encodeURIComponent(relatedSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          // Exclude already-related and self
          const existingIds = new Set(related.map((r) => r.id))
          if (initial?.id) existingIds.add(initial.id)
          setRelatedResults(
            data.filter((d: RelatedItem) => !existingIds.has(d.id))
          )
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [relatedSearch, related, initial?.id])

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const addRelated = (item: RelatedItem) => {
    setRelated((prev) => [...prev, item])
    setRelatedSearch('')
    setRelatedResults([])
  }

  const removeRelated = (id: string) => {
    setRelated((prev) => prev.filter((r) => r.id !== id))
  }

  const moveRelated = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= related.length) return
    setRelated((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next
    })
  }

  const handleSave = useCallback(
    async (overrideStatus?: string) => {
      setError('')
      setIsSaving(true)

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const finalStatus = overrideStatus || status

      const selectedPrimaryNames = allPrimaryTags
        .filter((t) => selectedPrimaryTagIds.has(t.id))
        .map((t) => t.name)

      const payload = {
        title,
        slug,
        contentType,
        dek: dek || null,
        bodyMd,
        status: finalStatus,
        publishAt: finalStatus === 'SCHEDULED' ? publishAt || null : null,
        authorName: authorName || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        canonicalUrl: canonicalUrl || null,
        ogImageUrl: ogImageUrl || null,
        geoScope: geoScope || null,
        geoPlace: geoPlace || null,
        robotsNoIndex,
        primaryCollectionId: primaryCollectionId || null,
        tags,
        primaryTags: selectedPrimaryNames,
        collectionIds: selectedCollectionIds,
        relatedIds: related.map((r) => r.id),
      }

      try {
        const url = isEdit
          ? `/api/admin/content/${initial.id}`
          : '/api/admin/content'
        const method = isEdit ? 'PUT' : 'POST'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Save failed')
          return
        }

        const data = await res.json()
        if (!isEdit) {
          router.push(`/admin/content/${data.id}`)
        }
      } catch {
        setError('Save failed')
      } finally {
        setIsSaving(false)
      }
    },
    [
      title, slug, contentType, dek, bodyMd, status, publishAt, authorName,
      metaTitle, metaDescription, canonicalUrl, ogImageUrl, geoScope, geoPlace,
      robotsNoIndex, primaryCollectionId, tagsInput, selectedPrimaryTagIds,
      allPrimaryTags, selectedCollectionIds, related, isEdit, initial?.id, router,
    ]
  )

  const inputClass =
    'w-full bg-basalt border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none placeholder:text-cream/30'
  const labelClass = 'block text-xs text-cream/50 mb-1'

  return (
    <div className="max-w-4xl space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Core fields */}
      <div className="bg-basalt-50 rounded-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'GUIDE' | 'STORY')}
              className={inputClass}
              disabled={isEdit}
            >
              <option value="GUIDE">Guide</option>
              <option value="STORY">Story</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED')}
              className={inputClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {status === 'SCHEDULED' && (
          <div>
            <label className={labelClass}>Publish At</label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Slug{' '}
            <button
              type="button"
              onClick={() => setSlugManual(!slugManual)}
              className="text-sandstone/60 hover:text-sandstone ml-1"
            >
              ({slugManual ? 'auto' : 'manual'})
            </button>
          </label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManual(true)
            }}
            placeholder="article-slug"
            className={inputClass}
            readOnly={!slugManual}
          />
        </div>

        <div>
          <label className={labelClass}>Dek (subtitle)</label>
          <input
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            placeholder="Brief description"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Author</label>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            className={inputClass}
          />
        </div>
      </div>

      {/* Body */}
      <div className="bg-basalt-50 rounded-card p-6">
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Body (Markdown)</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-sandstone/60 hover:text-sandstone"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {showPreview ? (
          <div className="prose prose-invert max-w-none text-sm text-cream/80 bg-basalt rounded p-4 min-h-[300px] overflow-auto whitespace-pre-wrap">
            {bodyMd || 'Nothing to preview'}
          </div>
        ) : (
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder="Write your content in Markdown..."
            className={`${inputClass} min-h-[300px] font-mono resize-y`}
          />
        )}
      </div>

      {/* Category (Primary Tags) */}
      <div className="bg-basalt-50 rounded-card p-6">
        <h3 className="text-sm text-cream/70 font-medium mb-1">Category</h3>
        <p className="text-xs text-cream/30 mb-3">
          Select which Table of Contents section(s) this article belongs to.
        </p>
        {allPrimaryTags.length > 0 ? (
          <div className="space-y-1.5 mb-3">
            {allPrimaryTags.map((pt) => (
              <label key={pt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPrimaryTagIds.has(pt.id)}
                  onChange={() => {
                    setSelectedPrimaryTagIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(pt.id)) next.delete(pt.id)
                      else next.add(pt.id)
                      return next
                    })
                  }}
                  className="rounded border-cream/20 bg-transparent text-sandstone focus:ring-sandstone"
                />
                <span className="text-cream/70">{pt.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-cream/30 mb-3">Loading categories...</p>
        )}
        <div className="flex gap-2">
          <input
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const name = newCategoryInput.trim()
                if (!name) return
                const slug = name
                  .toLowerCase()
                  .replace(/['']/g, '')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '')
                // Check if already exists (case-insensitive)
                const existing = allPrimaryTags.find((t) => t.slug === slug)
                if (existing) {
                  setSelectedPrimaryTagIds((prev) => new Set([...prev, existing.id]))
                } else {
                  const tempId = `new-${slug}`
                  setAllPrimaryTags((prev) => [...prev, { id: tempId, name, slug }])
                  setSelectedPrimaryTagIds((prev) => new Set([...prev, tempId]))
                }
                setNewCategoryInput('')
              }
            }}
            placeholder="Add new category..."
            className={`${inputClass} flex-1`}
          />
          <span className="text-xs text-cream/20 self-center whitespace-nowrap">
            Press Enter
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-basalt-50 rounded-card p-6">
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="hawaii, renovation, permits"
          className={inputClass}
        />
      </div>

      {/* Geo */}
      <div className="bg-basalt-50 rounded-card p-6">
        <h3 className="text-sm text-cream/70 font-medium mb-3">Geography</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Scope</label>
            <select
              value={geoScope}
              onChange={(e) => setGeoScope(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              <option value="STATEWIDE">Statewide</option>
              <option value="OAHU">Oahu</option>
              <option value="MAUI">Maui</option>
              <option value="KAUAI">Kauai</option>
              <option value="HAWAII_ISLAND">Hawaii Island</option>
              <option value="LANAI">Lanai</option>
              <option value="MOLOKAI">Molokai</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Place</label>
            <input
              value={geoPlace}
              onChange={(e) => setGeoPlace(e.target.value)}
              placeholder="e.g. Kailua"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Collections */}
      {allCollections.length > 0 && (
        <div className="bg-basalt-50 rounded-card p-6">
          <h3 className="text-sm text-cream/70 font-medium mb-3">
            Collections
          </h3>
          <div className="space-y-2 mb-4">
            {allCollections.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCollectionIds.includes(c.id)}
                  onChange={() => toggleCollection(c.id)}
                  className="rounded"
                />
                <span className="text-cream/70">{c.title}</span>
              </label>
            ))}
          </div>
          {selectedCollectionIds.length > 0 && (
            <div>
              <label className={labelClass}>Primary Collection</label>
              <select
                value={primaryCollectionId}
                onChange={(e) => setPrimaryCollectionId(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {allCollections
                  .filter((c) => selectedCollectionIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Related Content */}
      <div className="bg-basalt-50 rounded-card p-6">
        <h3 className="text-sm text-cream/70 font-medium mb-3">
          Related Content
        </h3>
        <div className="relative mb-4">
          <input
            value={relatedSearch}
            onChange={(e) => setRelatedSearch(e.target.value)}
            placeholder="Search by title..."
            className={inputClass}
          />
          {relatedResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-basalt-50 border border-cream/10 rounded shadow-lg max-h-48 overflow-auto">
              {relatedResults.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => addRelated(r)}
                    className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
                  >
                    {r.title}{' '}
                    <span className="text-cream/30 text-xs">
                      {r.contentType}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {related.length > 0 && (
          <ul className="space-y-1">
            {related.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center gap-2 bg-basalt rounded px-3 py-2 text-sm"
              >
                <span className="text-cream/30 text-xs w-4">{i + 1}</span>
                <span className="flex-1 text-cream/70">{r.title}</span>
                <button
                  type="button"
                  onClick={() => moveRelated(i, -1)}
                  disabled={i === 0}
                  className="text-cream/30 hover:text-cream disabled:opacity-20 text-xs"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  onClick={() => moveRelated(i, 1)}
                  disabled={i === related.length - 1}
                  className="text-cream/30 hover:text-cream disabled:opacity-20 text-xs"
                >
                  &#9660;
                </button>
                <button
                  type="button"
                  onClick={() => removeRelated(r.id)}
                  className="text-cream/30 hover:text-red-400 text-xs"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Images */}
      {isEdit && (
        <ImagePanel
          contentId={initial.id}
          onSetHero={(url) => setOgImageUrl(url)}
        />
      )}

      {/* SEO */}
      <div className="bg-basalt-50 rounded-card p-6">
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="text-sm text-cream/70 font-medium flex items-center gap-2"
        >
          SEO Settings{' '}
          <span className="text-cream/30">{showSeo ? '▲' : '▼'}</span>
        </button>
        {showSeo && (
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>Meta Title</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Override page title for search"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Search result description"
                className={`${inputClass} resize-y`}
                rows={2}
              />
            </div>
            <div>
              <label className={labelClass}>Canonical URL</label>
              <input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>OG Image URL</label>
              <input
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-cream/60">
              <input
                type="checkbox"
                checked={robotsNoIndex}
                onChange={(e) => setRobotsNoIndex(e.target.checked)}
              />
              noindex (hide from search engines)
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={() => handleSave()} disabled={isSaving}>
          {isSaving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
        </Button>
        {status !== 'PUBLISHED' && (
          <Button
            variant="secondary"
            onClick={() => handleSave('PUBLISHED')}
            disabled={isSaving}
          >
            Publish Now
          </Button>
        )}
        {isEdit && (
          <Link
            href={`/${contentType === 'GUIDE' ? 'hawaii-home-renovation' : 'stories'}/${slug}`}
            target="_blank"
            className="text-sm text-cream/40 hover:text-cream/60 ml-auto"
          >
            View public page &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}

