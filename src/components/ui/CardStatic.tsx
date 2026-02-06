import { cn } from '@/lib/utils'
import { Badge } from './Badge'

interface CardStaticProps {
  title: string
  description: string
  badge?: string
  className?: string
}

export function CardStatic({ title, description, badge = 'Coming Soon', className }: CardStaticProps) {
  return (
    <div
      className={cn(
        'p-6 bg-basalt-50 rounded-card opacity-60',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-serif text-xl text-sandstone">{title}</h3>
        <Badge>{badge}</Badge>
      </div>
      <p className="text-cream/70 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
