'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { generateSlug } from '@/lib/slug'

interface CollectionItem {
  contentId: string
  title: string
  contentType: string
  priority: number
  pinned: boolean
}

interface SearchResult {
  id: string
  title: string
  contentType: string
  slug: string
}

interface CollectionEditorProps {
  initial?: {
    id: string
    title: string
    slug: string
    description: string | null
    heroImageUrl: string | null
    layout: string
    items: {
      content: { id: string; title: string; contentType: string }
      priority: number
      pinned: boolean
    }[]
  }
}

export function CollectionEditor({ initial }: CollectionEditorProps) {
  const router = useRouter()
  const isEdit = !!initial

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initial)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '')
  const [layout, setLayout] = useState(initial?.layout ?? 'TILES')

  const [items, setItems] = useState<CollectionItem[]>(
    initial?.items.map((i) => ({
      contentId: i.content.id,
      title: i.content.title,
      contentType: i.content.contentType,
      priority: i.priority,
      pinned: i.pinned,
    })) ?? []
  )

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title))
  }, [title, slugManual])

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/content/search?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data) => {
          const existingIds = new Set(items.map((i) => i.contentId))
          setSearchResults(data.filter((d: SearchResult) => !existingIds.has(d.id)))
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search, items])

  const addItem = (result: SearchResult) => {
    setItems((prev) => [
      ...prev,
      {
        contentId: result.id,
        title: result.title,
        contentType: result.contentType,
        priority: prev.length,
        pinned: false,
      },
    ])
    setSearch('')
    setSearchResults([])
  }

  const removeItem = (contentId: string) => {
    setItems((prev) =>
      prev
        .filter((i) => i.contentId !== contentId)
        .map((i, idx) => ({ ...i, priority: idx }))
    )
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    setItems((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next.map((i, idx) => ({ ...i, priority: idx }))
    })
  }

  const togglePin = (index: number) => {
    setItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, pinned: !i.pinned } : i
      )
    )
  }

  const handleSave = async () => {
    setError('')
    setIsSaving(true)
    try {
      const payload = {
        title,
        slug,
        description: description || null,
        heroImageUrl: heroImageUrl || null,
        layout,
        items: items.map((i) => ({
          contentId: i.contentId,
          priority: i.priority,
          pinned: i.pinned,
        })),
      }

      const url = isEdit
        ? `/api/admin/collections/${initial.id}`
        : '/api/admin/collections'
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
      if (!isEdit) router.push(`/admin/collections/${data.id}`)
    } catch {
      setError('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full bg-basalt border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none placeholder:text-cream/30'
  const labelClass = 'block text-xs text-cream/50 mb-1'

  return (
    <div className="max-w-3xl space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-basalt-50 rounded-card p-6 space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Collection title"
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
            className={inputClass}
            readOnly={!slugManual}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-y`}
            rows={2}
          />
        </div>
        <div>
          <label className={labelClass}>Hero Image URL</label>
          <input
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Layout</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className={inputClass}
          >
            <option value="TILES">Tiles</option>
            <option value="CARDS">Cards</option>
            <option value="LIST">List</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="bg-basalt-50 rounded-card p-6">
        <h3 className="text-sm text-cream/70 font-medium mb-3">Items</h3>
        <div className="relative mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content to add..."
            className={inputClass}
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-basalt-50 border border-cream/10 rounded shadow-lg max-h-48 overflow-auto">
              {searchResults.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => addItem(r)}
                    className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
                  >
                    {r.title}{' '}
                    <span className="text-cream/30 text-xs">{r.contentType}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={item.contentId}
                className="flex items-center gap-2 bg-basalt rounded px-3 py-2 text-sm"
              >
                <span className="text-cream/30 text-xs w-4">{i + 1}</span>
                <span className="flex-1 text-cream/70">{item.title}</span>
                <span className="text-cream/30 text-xs">{item.contentType}</span>
                <label className="flex items-center gap-1 text-xs text-cream/40">
                  <input
                    type="checkbox"
                    checked={item.pinned}
                    onChange={() => togglePin(i)}
                  />
                  Pin
                </label>
                <button
                  type="button"
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="text-cream/30 hover:text-cream disabled:opacity-20 text-xs"
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  className="text-cream/30 hover:text-cream disabled:opacity-20 text-xs"
                >
                  &#9660;
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.contentId)}
                  className="text-cream/30 hover:text-red-400 text-xs"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
      </Button>
    </div>
  )
}
