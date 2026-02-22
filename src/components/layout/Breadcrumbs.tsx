import Link from 'next/link'

interface BreadcrumbsProps {
  items: { label: string; href?: string }[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="text-xs text-cream/40 mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.label}>
            {i > 0 && <span className="mx-2">/</span>}
            {isLast || !item.href ? (
              <span className="text-cream/60">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-cream/60 transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
