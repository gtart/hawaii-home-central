'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useToolState } from '@/hooks/useToolState'

interface AgreeItem {
  id: string
  question: string
  discussed: boolean
  notes: string
}

interface AgreeState {
  items: AgreeItem[]
}

const DEFAULT_ITEMS: AgreeItem[] = [
  {
    id: 'change_orders',
    question: 'How will changes be priced and approved?',
    discussed: false,
    notes: '',
  },
  {
    id: 'payment_timing',
    question: 'When is payment due, and for what?',
    discussed: false,
    notes: '',
  },
  {
    id: 'allowances',
    question: 'What happens if something is out of stock or over allowance?',
    discussed: false,
    notes: '',
  },
  {
    id: 'communication',
    question: 'How will you communicate, and how often?',
    discussed: false,
    notes: '',
  },
]

export function ThingsToAgreeOn() {
  const { state, setState, isLoaded, isSyncing } = useToolState<AgreeState>({
    toolKey: 'before_you_sign_notes',
    localStorageKey: 'hhc_before_you_sign_notes_v1',
    defaultValue: { items: DEFAULT_ITEMS },
  })

  const [newQuestion, setNewQuestion] = useState('')

  const toggleDiscussed = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, discussed: !item.discussed } : item
      ),
    }))
  }

  const updateNotes = (id: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, notes } : item
      ),
    }))
  }

  const addItem = () => {
    if (!newQuestion.trim()) return
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `custom_${Date.now()}`,
          question: newQuestion.trim(),
          discussed: false,
          notes: '',
        },
      ],
    }))
    setNewQuestion('')
  }

  const removeItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  const discussedCount = state.items.filter((i) => i.discussed).length

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <h2 className="font-serif text-2xl text-sandstone">
          Things to Agree On
        </h2>
        {isSyncing && (
          <span className="text-xs text-cream/30">Saving...</span>
        )}
      </div>
      <p className="text-cream/70 text-sm mb-6 leading-relaxed">
        Topics people forget to discuss until it&apos;s too late.
        Don&apos;t get surprised later.
      </p>

      {isLoaded && (
        <>
          <p className="text-cream/50 text-xs mb-6">
            Discussed {discussedCount}/{state.items.length}
          </p>

          <div className="space-y-4">
            {state.items.map((item) => (
              <div
                key={item.id}
                className="bg-basalt-50 rounded-card p-5"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`agree-${item.id}`}
                    checked={item.discussed}
                    onChange={() => toggleDiscussed(item.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-cream/30 bg-basalt-50 accent-sandstone cursor-pointer"
                  />
                  <label
                    htmlFor={`agree-${item.id}`}
                    className={cn(
                      'flex-1 text-sm leading-relaxed cursor-pointer transition-colors',
                      item.discussed ? 'line-through text-cream/40' : 'text-cream/80'
                    )}
                  >
                    {item.question}
                  </label>
                  {item.id.startsWith('custom_') && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-cream/30 hover:text-cream/60 transition-colors text-sm"
                      aria-label="Remove item"
                    >
                      &times;
                    </button>
                  )}
                </div>
                <div className="mt-3 pl-7">
                  <textarea
                    value={item.notes}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    placeholder="Notes on what you agreed..."
                    rows={2}
                    className={cn(
                      'w-full px-4 py-3 rounded-input text-sm leading-relaxed',
                      'bg-basalt border border-cream/15 text-cream',
                      'placeholder:text-cream/30',
                      'hover:border-cream/25',
                      'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
                      'resize-y min-h-[3rem]'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add your own question..."
              className={cn(
                'flex-1 px-4 py-2.5 rounded-input text-sm',
                'bg-basalt-50 border border-cream/15 text-cream',
                'placeholder:text-cream/30',
                'hover:border-cream/25',
                'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone'
              )}
            />
            <button
              onClick={addItem}
              disabled={!newQuestion.trim()}
              className={cn(
                'px-4 py-2.5 rounded-input text-sm font-medium transition-colors',
                newQuestion.trim()
                  ? 'bg-sandstone/20 text-sandstone hover:bg-sandstone/30'
                  : 'bg-basalt-50 text-cream/20 cursor-not-allowed'
              )}
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}
