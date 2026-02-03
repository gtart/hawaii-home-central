import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        {
          'bg-cream/10 text-cream/70': variant === 'default',
          'bg-sandstone/20 text-sandstone': variant === 'accent',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
