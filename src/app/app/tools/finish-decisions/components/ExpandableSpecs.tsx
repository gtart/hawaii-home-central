'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export function ExpandableSpecs({ value, readOnly, onChange, optionName }: { value: string; readOnly: boolean; onChange: (val: string) => void; optionName?: string }) {
  const [fullscreen, setFullscreen] = useState(false)
  const [readOnlyExpanded, setReadOnlyExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(72, el.scrollHeight) + 'px'
  }, [])

  useEffect(() => { autoGrow() }, [value, autoGrow])

  if (readOnly) {
    const isLong = value.split('\n').length > 10 || value.length > 400
    return (
      <div>
        <label className="text-[11px] text-cream/30 uppercase tracking-wider mb-1 block">Specs</label>
        <p className={`text-sm text-cream whitespace-pre-wrap ${!readOnlyExpanded && isLong ? 'line-clamp-10' : ''}`}>
          {value}
        </p>
        {isLong && (
          <button type="button" onClick={() => setReadOnlyExpanded(!readOnlyExpanded)} className="text-[11px] text-sandstone/60 hover:text-sandstone transition-colors mt-0.5">
            {readOnlyExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-cream/30 uppercase tracking-wider">Specs</label>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="text-cream/25 hover:text-cream/50 transition-colors"
            title="Expand specs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoGrow() }}
          placeholder="Specs, dimensions, details..."
          className="w-full bg-basalt border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50 resize-y"
          style={{ minHeight: '72px' }}
        />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/70" onClick={() => setFullscreen(false)} />
          <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-cream/10 shrink-0">
              <h2 className="text-sm font-medium text-cream truncate">
                Specs{optionName ? ` — ${optionName}` : ''}
              </h2>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="text-cream/40 hover:text-cream transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-5 overflow-hidden">
              <textarea
                autoFocus
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Specs, dimensions, details..."
                className="w-full h-full bg-basalt border border-cream/10 rounded-lg px-4 py-3 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50 resize-none"
                style={{ minHeight: '60vh' }}
              />
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-cream/10 shrink-0">
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="px-4 py-2 bg-sandstone/20 text-sandstone text-sm font-medium rounded-lg hover:bg-sandstone/30 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
