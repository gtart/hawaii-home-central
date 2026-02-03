import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'

interface CardProps {
  href: string
  title: string
  description: string
  badge?: string
  className?: string
}

export function Card({ href, title, description, badge, className }: CardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block p-6 bg-basalt-50 rounded-card card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sandstone focus-visible:ring-offset-2 focus-visible:ring-offset-basalt',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-serif text-xl text-sandstone">{title}</h3>
        {badge && <Badge>{badge}</Badge>}
      </div>
      <p className="text-cream/70 text-sm leading-relaxed">{description}</p>
    </Link>
  )
}
