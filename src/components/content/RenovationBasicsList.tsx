'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ArticleItem {
  id: string
  title: string
  slug: string
  dek: string | null
  geoScope: string | null
  primaryTagIds: string[]
}

interface PrimaryTag {
  id: string
  name: string
  slug: string
}

interface Props {
  articles: ArticleItem[]
  primaryTags: PrimaryTag[]
}

export function RenovationBasicsList({ articles, primaryTags }: Props) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = articles
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.dek && a.dek.toLowerCase().includes(q))
      )
    }
    if (activeTag) {
      result = result.filter((a) => a.primaryTagIds.includes(activeTag))
    }
    return result
  }, [articles, search, activeTag])

  // Group articles by primary tag
  const grouped = useMemo(() => {
    if (activeTag) {
      // Single tag selected — no grouping needed
      return [{ tag: primaryTags.find((t) => t.id === activeTag) || null, items: filtered }]
    }

    const groups: { tag: PrimaryTag | null; items: ArticleItem[] }[] = []
    const placed = new Set<string>()

    for (const tag of primaryTags) {
      const items = filtered.filter((a) => a.primaryTagIds.includes(tag.id))
      if (items.length > 0) {
        groups.push({ tag, items })
        items.forEach((a) => placed.add(a.id))
      }
    }

    // Articles without any primary tag
    const other = filtered.filter((a) => !placed.has(a.id))
    if (other.length > 0) {
      groups.push({ tag: null, items: other })
    }

    return groups
  }, [filtered, primaryTags, activeTag])

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-basalt-50 border border-cream/10 rounded-lg pl-10 pr-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-sandstone focus:outline-none transition-colors"
        />
      </div>

      {/* Primary tag pills */}
      {primaryTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              !activeTag
                ? 'bg-sandstone/20 text-sandstone font-medium'
                : 'bg-basalt-50 text-cream/50 hover:text-cream'
            )}
          >
            All
          </button>
          {primaryTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                activeTag === tag.id
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'bg-basalt-50 text-cream/50 hover:text-cream'
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Article list */}
      {filtered.length === 0 ? (
        <p className="text-cream/40 py-8 text-center">
          No articles found.
        </p>
      ) : (
        <div className="space-y-10">
          {grouped.map((group, gi) => (
            <section key={group.tag?.id ?? 'other'}>
              {/* Group heading — show when "All" is active and there are multiple groups */}
              {!activeTag && grouped.length > 1 && (
                <h2 className="font-serif text-xl text-cream mb-4 pb-2 border-b border-cream/10">
                  {group.tag?.name ?? 'Other'}
                </h2>
              )}
              <ul className="divide-y divide-cream/5">
                {group.items.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/hawaii-home-renovation/${article.slug}`}
                      className="block py-4 hover:bg-cream/[0.02] transition-colors -mx-3 px-3 rounded"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg text-sandstone mb-1">
                            {article.title}
                          </h3>
                          {article.dek && (
                            <p className="text-cream/50 text-sm line-clamp-1">
                              {article.dek}
                            </p>
                          )}
                        </div>
                        {article.geoScope &&
                          article.geoScope !== 'STATEWIDE' && (
                            <Badge className="shrink-0 mt-1">
                              {article.geoScope.replace('_', ' ')}
                            </Badge>
                          )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
