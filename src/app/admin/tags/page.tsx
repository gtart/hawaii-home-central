'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TagRow {
  id: string
  name: string
  slug: string
  isPrimary: boolean
  _count: { contentTags: number }
}

export default function TagsAdminPage() {
  const [tags, setTags] = useState<TagRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/tags')
      .then((r) => r.json())
      .then((data) => {
        setTags(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  async function togglePrimary(id: string, current: boolean) {
    setToggling(id)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPrimary: !current }),
      })
      if (res.ok) {
        setTags((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, isPrimary: !current } : t
          )
        )
      }
    } finally {
      setToggling(null)
    }
  }

  const primaryCount = tags.filter((t) => t.isPrimary).length

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-serif text-2xl text-sandstone mb-2">Tags</h1>
      <p className="text-sm text-cream/50 mb-6">
        Toggle tags as &ldquo;Primary&rdquo; to use them as categories on the
        Renovation Basics hub page. {primaryCount > 0 && `${primaryCount} primary tag${primaryCount !== 1 ? 's' : ''} active.`}
      </p>

      {isLoading ? (
        <p className="text-cream/30">Loading...</p>
      ) : tags.length === 0 ? (
        <p className="text-cream/30">
          No tags yet. Tags are created when you add them to content.
        </p>
      ) : (
        <div className="bg-basalt-50 rounded-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/10 text-cream/50">
                <th className="text-left px-4 py-3 font-medium">Tag</th>
                <th className="text-left px-4 py-3 font-medium w-20">
                  Articles
                </th>
                <th className="text-center px-4 py-3 font-medium w-24">
                  Primary
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr
                  key={tag.id}
                  className={cn(
                    'border-b border-cream/5 transition-colors',
                    tag.isPrimary && 'bg-sandstone/5'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="text-cream font-medium">{tag.name}</span>
                    <span className="text-cream/30 text-xs ml-2">
                      {tag.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cream/50 text-center">
                    {tag._count.contentTags}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePrimary(tag.id, tag.isPrimary)}
                      disabled={toggling === tag.id}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        tag.isPrimary ? 'bg-sandstone' : 'bg-cream/15',
                        toggling === tag.id && 'opacity-50'
                      )}
                      aria-label={`Toggle ${tag.name} as primary`}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                          tag.isPrimary ? 'translate-x-4' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
