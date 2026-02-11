'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-serif text-3xl text-sandstone mt-10 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-2xl text-sandstone mt-8 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-xl text-sandstone mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-serif text-lg text-sandstone mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-cream/80 leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sandstone hover:text-sandstone-light underline transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="text-cream/70 space-y-2 mb-4 ml-4 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-cream/70 space-y-2 mb-4 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-sandstone pl-4 my-4 text-cream/60 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className={`${className} block bg-basalt-50 rounded p-4 text-sm text-cream/80 overflow-x-auto font-mono`}>
          {children}
        </code>
      )
    }
    return (
      <code className="bg-basalt-50 rounded px-1.5 py-0.5 text-sm text-sandstone/80 font-mono">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="mb-4">{children}</pre>,
  img: ({ src, alt }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt ?? ''}
        className="rounded-card w-full"
        loading="lazy"
      />
      {alt && (
        <figcaption className="text-xs text-cream/40 mt-2 text-center">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-cream/20 text-cream/70">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-cream/60 border-b border-cream/5">{children}</td>
  ),
  hr: () => <hr className="border-cream/10 my-8" />,
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
