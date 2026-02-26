'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useProject } from '@/contexts/ProjectContext'

type AccessLevel = 'OWNER' | 'EDIT' | 'VIEW'

interface UseToolStateOptions<T> {
  toolKey:
    | 'hold_points'
    | 'fair_bid_checklist'
    | 'responsibility_matrix'
    | 'finish_decisions'
    | 'before_you_sign'
    | 'before_you_sign_notes'
    | 'punchlist'
    | 'mood_boards'
  localStorageKey: string
  defaultValue: T
  /** When true, skip API calls and only use localStorage. */
  localOnly?: boolean
}

interface UseToolStateReturn<T> {
  state: T
  setState: (updater: (prev: T) => T) => void
  isLoaded: boolean
  isSyncing: boolean
  /** User's access level for this tool. null while loading or in localOnly mode. */
  access: AccessLevel | null
  /** True when access is VIEW (edits won't be saved). */
  readOnly: boolean
  /** True when user has no access at all (403). */
  noAccess: boolean
  /** True briefly when a 409 conflict was detected and state was reloaded. */
  conflictBanner: boolean
}

const POLL_INTERVAL = 20_000

export function useToolState<T>({
  toolKey,
  localStorageKey,
  defaultValue,
  localOnly = false,
}: UseToolStateOptions<T>): UseToolStateReturn<T> {
  const { currentProject } = useProject()
  const projectId = currentProject?.id

  // Scope localStorage by project to prevent cross-project data leakage
  const scopedKey = useMemo(
    () => localOnly ? localStorageKey : `${localStorageKey}:${projectId ?? 'default'}`,
    [localOnly, localStorageKey, projectId]
  )

  const [state, setStateInternal] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [access, setAccess] = useState<AccessLevel | null>(null)
  const [noAccess, setNoAccess] = useState(false)
  const [conflictBanner, setConflictBanner] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<T>(defaultValue)
  const accessRef = useRef<AccessLevel | null>(null)
  const defaultRef = useRef<T>(defaultValue)
  const revisionRef = useRef<string | null>(null)
  const conflictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Revalidate: fetch latest from server and update if revision changed
  const revalidate = useCallback(async () => {
    if (localOnly || !projectId) return
    try {
      const res = await fetch(`/api/tools/${toolKey}`)
      if (!res.ok) return
      const data = await res.json()
      const serverRev = data.updatedAt ? String(data.updatedAt) : null
      if (serverRev && serverRev !== revisionRef.current) {
        revisionRef.current = serverRev
        if (data.payload) {
          setStateInternal(data.payload as T)
          stateRef.current = data.payload as T
          try { localStorage.setItem(scopedKey, JSON.stringify(data.payload)) } catch {}
        }
      }
    } catch {
      // Silently ignore — polling is best-effort
    }
  }, [toolKey, localOnly, projectId, scopedKey])

  // Load state on mount (ProjectKeyWrapper remounts on project switch)
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (localOnly) {
        // Local-only mode: read from localStorage, skip API
        try {
          const stored = localStorage.getItem(scopedKey)
          if (stored && !cancelled) {
            const parsed = JSON.parse(stored) as T
            setStateInternal(parsed)
            stateRef.current = parsed
          }
        } catch {
          // ignore
        }
        if (!cancelled) setIsLoaded(true)
        return
      }

      // Wait for project to be determined before loading
      if (!projectId) return

      try {
        const res = await fetch(`/api/tools/${toolKey}`)

        if (cancelled) return

        if (res.status === 403) {
          setNoAccess(true)
          setIsLoaded(true)
          return
        }

        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()

        if (cancelled) return

        // Store access level from API
        if (data.access) {
          setAccess(data.access as AccessLevel)
          accessRef.current = data.access as AccessLevel
        }

        // Store server revision
        if (data.updatedAt) {
          revisionRef.current = String(data.updatedAt)
        }

        if (data.payload) {
          setStateInternal(data.payload as T)
          stateRef.current = data.payload as T
          // Mirror to project-scoped localStorage
          try {
            localStorage.setItem(scopedKey, JSON.stringify(data.payload))
          } catch {
            // ignore
          }
        } else {
          // DB empty — try project-scoped localStorage as fallback
          try {
            const stored = localStorage.getItem(scopedKey)
            if (stored) {
              const parsed = JSON.parse(stored) as T
              setStateInternal(parsed)
              stateRef.current = parsed
            } else {
              // No cached data for this project — use default
              setStateInternal(defaultRef.current)
              stateRef.current = defaultRef.current
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // API failed — fall back to project-scoped localStorage
        try {
          const stored = localStorage.getItem(scopedKey)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- projectId captured via scopedKey; defaultValue is stable via ref
  }, [toolKey, scopedKey, localOnly, projectId])

  // Polling + visibility revalidation
  useEffect(() => {
    if (localOnly || !projectId || !isLoaded) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    function startPolling() {
      stopPolling()
      intervalId = setInterval(revalidate, POLL_INTERVAL)
    }

    function stopPolling() {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        revalidate()
        startPolling()
      } else {
        stopPolling()
      }
    }

    function handleFocus() {
      revalidate()
    }

    // Start polling if page is visible
    if (document.visibilityState === 'visible') {
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [localOnly, projectId, isLoaded, revalidate])

  // Debounced save to API (skipped in localOnly mode and VIEW access)
  const saveToApi = useCallback(
    (payload: T) => {
      if (localOnly) return
      // Don't save if VIEW-only
      if (accessRef.current === 'VIEW') return

      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(async () => {
        setIsSyncing(true)
        try {
          const res = await fetch(`/api/tools/${toolKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload, revision: revisionRef.current }),
          })

          if (res.status === 409) {
            // Conflict: another editor saved while we were editing
            if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current)
            setConflictBanner(true)
            conflictTimerRef.current = setTimeout(() => setConflictBanner(false), 5000)
            // Re-fetch latest state
            await revalidate()
            return
          }

          if (res.ok) {
            const data = await res.json()
            if (data.updatedAt) {
              revisionRef.current = String(data.updatedAt)
            }
          }
        } catch {
          // Silently fail — localStorage is the backup
        } finally {
          setIsSyncing(false)
        }
      }, 500)
    },
    [toolKey, localOnly, revalidate]
  )

  const setState = useCallback(
    (updater: (prev: T) => T) => {
      setStateInternal((prev) => {
        const next = updater(prev)
        stateRef.current = next

        // Write to project-scoped localStorage immediately for instant UX
        try {
          localStorage.setItem(scopedKey, JSON.stringify(next))
        } catch {
          // ignore
        }

        // Debounced write to API (no-op in localOnly or VIEW mode)
        saveToApi(next)

        return next
      })
    },
    [scopedKey, saveToApi]
  )

  const readOnly = access === 'VIEW'

  return { state, setState, isLoaded, isSyncing, access, readOnly, noAccess, conflictBanner }
}
