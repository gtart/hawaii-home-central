import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sandstone focus-visible:ring-offset-2 focus-visible:ring-offset-basalt',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-sandstone text-basalt hover:bg-sandstone-light active:bg-sandstone-dark':
              variant === 'primary',
            'bg-basalt-50 text-cream border border-cream/20 hover:border-cream/40 hover:bg-basalt-100':
              variant === 'secondary',
            'text-cream hover:text-sandstone':
              variant === 'ghost',
          },
          {
            'text-sm px-4 py-2 rounded-button': size === 'sm',
            'text-base px-6 py-3 rounded-button': size === 'md',
            'text-lg px-8 py-4 rounded-button': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
