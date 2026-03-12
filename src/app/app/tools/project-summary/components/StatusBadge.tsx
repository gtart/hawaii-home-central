'use client'

interface StatusBadgeProps {
  label: string
  color: string
  bgColor: string
  onClick?: () => void
  readOnly?: boolean
}

export function StatusBadge({ label, color, bgColor, onClick, readOnly }: StatusBadgeProps) {
  if (readOnly || !onClick) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${color} ${bgColor}`}>
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${color} ${bgColor} hover:opacity-80 transition-opacity cursor-pointer`}
      title="Click to change status"
    >
      {label}
    </button>
  )
}
