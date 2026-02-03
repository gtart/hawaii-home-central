'use client'

import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-cream/80"
          >
            {label}
            {props.required && <span className="text-sandstone ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-input',
            'bg-basalt-50 border border-cream/20 text-cream placeholder:text-cream/40',
            'transition-colors duration-200',
            'hover:border-cream/30',
            'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
