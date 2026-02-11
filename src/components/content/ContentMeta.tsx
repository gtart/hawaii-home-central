interface ContentMetaProps {
  authorName?: string | null
  publishedAt?: Date | string | null
  wordCount?: number
}

export function ContentMeta({
  authorName,
  publishedAt,
  wordCount,
}: ContentMetaProps) {
  const date = publishedAt ? new Date(publishedAt) : null
  const readTime = wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : null

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-cream/50">
      {authorName && <span>By {authorName}</span>}
      {authorName && date && <span className="text-cream/20">&middot;</span>}
      {date && (
        <time dateTime={date.toISOString()}>
          {date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      )}
      {readTime && (
        <>
          <span className="text-cream/20">&middot;</span>
          <span>{readTime} min read</span>
        </>
      )}
    </div>
  )
}
