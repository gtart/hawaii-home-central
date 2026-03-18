'use client'

export function FeedbackLink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-feedback-form'))}
      className={className}
    >
      {children}
    </button>
  )
}
