import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href: string
}

export function ContentBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-xs text-cream/40 mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.href}>
          {i > 0 && <span className="mx-2">/</span>}
          {i < items.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-cream/60 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-cream/60">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
