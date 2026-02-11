'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { ContentType, ContentStatus } from '@prisma/client'

interface ContentRow {
  id: string
  title: string
  slug: string
  contentType: ContentType
  status: ContentStatus
  publishAt: string | null
  publishedAt: string | null
  updatedAt: string
  primaryCollection: { title: string } | null
  tags: { tag: { id: string; name: string } }[]
}

interface PrimaryTag {
  id: string
  name: string
  slug: string
}

const TABS: { key: ContentType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'GUIDE', label: 'Renovation Basics' },
  { key: 'STORY', label: 'Stories' },
]

export function ContentList() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as ContentType | null

  const [activeTab, setActiveTab] = useState<ContentType | 'ALL'>(
    initialType || 'ALL'
  )
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ContentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [primaryTags, setPrimaryTags] = useState<PrimaryTag[]>([])
  const [savingCategory, setSavingCategory] = useState<string | null>(null)

  // Load primary tags
  useEffect(() => {
    fetch('/api/admin/tags')
      .then((r) => r.json())
      .then((data: { id: string; name: string; slug: string; isPrimary: boolean }[]) => {
        setPrimaryTags(
          data
            .filter((t) => t.isPrimary)
            .map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (activeTab !== 'ALL') params.set('type', activeTab)
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)

    fetch(`/api/admin/content?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data)
        setIsLoading(false)
        setSelected(new Set())
      })
      .catch(() => setIsLoading(false))
  }, [activeTab, statusFilter, search])

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—'

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.id)))
    }
  }

  // Get primary tag for an item
  function getItemPrimaryTag(item: ContentRow): string {
    const primaryTagIds = new Set(primaryTags.map((pt) => pt.id))
    const match = item.tags.find((t) => primaryTagIds.has(t.tag.id))
    return match?.tag.id ?? ''
  }

  // Inline category change
  async function handleCategoryChange(itemId: string, tagId: string) {
    setSavingCategory(itemId)
    const tagName = primaryTags.find((t) => t.id === tagId)?.name
    const primaryTagNames = tagName ? [tagName] : []

    try {
      await fetch(`/api/admin/content/${itemId}/primary-tag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryTagNames }),
      })

      // Update local state optimistically
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          // Remove old primary tags from item.tags, add new one
          const nonPrimary = item.tags.filter(
            (t) => !primaryTags.some((pt) => pt.id === t.tag.id)
          )
          if (tagName && tagId) {
            const pt = primaryTags.find((t) => t.id === tagId)!
            nonPrimary.push({ tag: { id: pt.id, name: pt.name } })
          }
          return { ...item, tags: nonPrimary }
        })
      )
    } finally {
      setSavingCategory(null)
    }
  }

  async function executeBulk(action: 'PUBLISH' | 'DRAFT' | 'DELETE') {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/content/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      })
      if (res.ok) {
        const params = new URLSearchParams()
        if (activeTab !== 'ALL') params.set('type', activeTab)
        if (statusFilter) params.set('status', statusFilter)
        if (search) params.set('search', search)
        const data = await fetch(`/api/admin/content?${params}`).then((r) =>
          r.json()
        )
        setItems(data)
        setSelected(new Set())
      }
    } finally {
      setBulkLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-basalt-50 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded text-sm transition-colors',
                activeTab === tab.key
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ContentStatus | '')
          }
          className="bg-basalt-50 border border-cream/10 rounded px-3 py-1.5 text-sm text-cream focus:border-sandstone focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title..."
          className="bg-basalt-50 border border-cream/10 rounded px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:border-sandstone focus:outline-none flex-1 min-w-[200px]"
        />

        {/* New buttons */}
        <Link
          href="/admin/content/new?type=GUIDE"
          className="px-3 py-1.5 bg-sandstone text-basalt rounded text-sm font-medium hover:bg-sandstone-light transition-colors"
        >
          + Guide
        </Link>
        <Link
          href="/admin/content/new?type=STORY"
          className="px-3 py-1.5 bg-sandstone text-basalt rounded text-sm font-medium hover:bg-sandstone-light transition-colors"
        >
          + Story
        </Link>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-sandstone/10 border border-sandstone/20 rounded-lg px-4 py-2.5">
          <span className="text-sm text-sandstone font-medium">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => executeBulk('PUBLISH')}
            disabled={bulkLoading}
            className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-xs font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={() => executeBulk('DRAFT')}
            disabled={bulkLoading}
            className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
          >
            Draft
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Are you sure?</span>
              <button
                onClick={() => executeBulk('DELETE')}
                disabled={bulkLoading}
                className="px-3 py-1 bg-red-600/30 text-red-400 rounded text-xs font-medium hover:bg-red-600/40 transition-colors disabled:opacity-50"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 text-cream/50 rounded text-xs hover:text-cream transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={bulkLoading}
              className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-basalt-50 rounded-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/10 text-cream/50">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleSelectAll}
                  className="rounded border-cream/20 bg-transparent text-sandstone focus:ring-sandstone"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium w-40">Category</th>
              <th className="text-left px-4 py-3 font-medium w-24">Type</th>
              <th className="text-left px-4 py-3 font-medium w-28">Status</th>
              <th className="text-left px-4 py-3 font-medium w-28">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-cream/30">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-cream/30">
                  No content found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-cream/5 hover:bg-cream/5 transition-colors',
                    selected.has(item.id) && 'bg-sandstone/5'
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-cream/20 bg-transparent text-sandstone focus:ring-sandstone"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/${item.id}`}
                      className="text-cream hover:text-sandstone transition-colors font-medium"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-cream/30 mt-0.5">
                      /{item.contentType === 'GUIDE' ? 'hawaii-home-renovation' : 'stories'}/
                      {item.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={getItemPrimaryTag(item)}
                      onChange={(e) =>
                        handleCategoryChange(item.id, e.target.value)
                      }
                      disabled={savingCategory === item.id}
                      className={cn(
                        'bg-transparent border border-cream/10 rounded px-2 py-1 text-xs focus:border-sandstone focus:outline-none w-full',
                        savingCategory === item.id
                          ? 'text-cream/30'
                          : getItemPrimaryTag(item)
                            ? 'text-sandstone'
                            : 'text-cream/30'
                      )}
                    >
                      <option value="">—</option>
                      {primaryTags.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-cream/50 text-xs">
                    {item.contentType}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-cream/50 text-xs">
                    {fmt(item.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
