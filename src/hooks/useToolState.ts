'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseToolStateOptions<T> {
  toolKey:
    | 'hold_points'
    | 'fair_bid_checklist'
    | 'responsibility_matrix'
    | 'finish_decisions'
    | 'before_you_sign_notes'
  localStorageKey: string
  defaultValue: T
}

interface UseToolStateReturn<T> {
  state: T
  setState: (updater: (prev: T) => T) => void
  isLoaded: boolean
  isSyncing: boolean
}

export function useToolState<T>({
  toolKey,
  localStorageKey,
  defaultValue,
}: UseToolStateOptions<T>): UseToolStateReturn<T> {
  const [state, setStateInternal] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<T>(defaultValue)

  // Load state from API on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/tools/${toolKey}`)
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()

        if (cancelled) return

        if (data.payload) {
          setStateInternal(data.payload as T)
          stateRef.current = data.payload as T
          // Mirror to localStorage
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(data.payload))
          } catch {
            // ignore
          }
        } else {
          // DB empty — try localStorage as fallback
          try {
            const stored = localStorage.getItem(localStorageKey)
            if (stored) {
              const parsed = JSON.parse(stored) as T
              setStateInternal(parsed)
              stateRef.current = parsed
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // API failed — fall back to localStorage
        try {
          const stored = localStorage.getItem(localStorageKey)
          if (stored) {
            const parsed = JSON.parse(stored) as T
            setStateInternal(parsed)
            stateRef.current = parsed
          }
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [toolKey, localStorageKey])

  // Debounced save to API
  const saveToApi = useCallback(
    (payload: T) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(async () => {
        setIsSyncing(true)
        try {
          await fetch(`/api/tools/${toolKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
          })
        } catch {
          // Silently fail — localStorage is the backup
        } finally {
          setIsSyncing(false)
        }
      }, 500)
    },
    [toolKey]
  )

  const setState = useCallback(
    (updater: (prev: T) => T) => {
      setStateInternal((prev) => {
        const next = updater(prev)
        stateRef.current = next

        // Write to localStorage immediately for instant UX
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(next))
        } catch {
          // ignore
        }

        // Debounced write to API
        saveToApi(next)

        return next
      })
    },
    [localStorageKey, saveToApi]
  )

  return { state, setState, isLoaded, isSyncing }
}
