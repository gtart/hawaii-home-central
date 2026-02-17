import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'deciding' | 'shortlist' | 'selected' | 'ordered' | 'done'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        {
          'bg-cream/10 text-cream/70': variant === 'default',
          'bg-sandstone/20 text-sandstone': variant === 'accent' || variant === 'ordered',
          'bg-amber-500/15 text-amber-400': variant === 'deciding',
          'bg-sky-500/15 text-sky-400': variant === 'shortlist',
          'bg-violet-500/15 text-violet-400': variant === 'selected',
          'bg-emerald-500/15 text-emerald-400': variant === 'done',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
