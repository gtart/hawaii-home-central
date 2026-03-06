'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

export interface ActivityEventHint {
  entityType?: string
  entityId?: string
  action: string
  summaryText: string
  entityLabel?: string
  detailText?: string
}

type CollectionAccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER'

interface UseCollectionStateOptions<T> {
  collectionId: string | null
  toolKey: string
  localStorageKey: string
  defaultValue: T
}

interface UseCollectionStateReturn<T> {
  state: T
  setState: (updater: (prev: T) => T, events?: ActivityEventHint[]) => void
  isLoaded: boolean
  isSyncing: boolean
  access: CollectionAccessLevel | null
  readOnly: boolean
  noAccess: boolean
  conflictBanner: boolean
  viewOnlyAttempt: boolean
  title: string
  collectionId: string | null
  projectId: string | null
}

const POLL_INTERVAL = 20_000

export function useCollectionState<T>({
  collectionId,
  toolKey,
  localStorageKey,
  defaultValue,
}: UseCollectionStateOptions<T>): UseCollectionStateReturn<T> {
  const scopedKey = useMemo(
    () => `${localStorageKey}:coll:${collectionId ?? 'none'}`,
    [localStorageKey, collectionId]
  )

  const [state, setStateInternal] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [access, setAccess] = useState<CollectionAccessLevel | null>(null)
  const [noAccess, setNoAccess] = useState(false)
  const [conflictBanner, setConflictBanner] = useState(false)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<T>(defaultValue)
  const accessRef = useRef<CollectionAccessLevel | null>(null)
  const defaultRef = useRef<T>(defaultValue)
  const revisionRef = useRef<string | null>(null)
  const conflictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingEventsRef = useRef<ActivityEventHint[]>([])

  const revalidate = useCallback(async () => {
    if (!collectionId) return
    try {
      const res = await fetch(`/api/collections/${collectionId}`)
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
      if (data.title) setTitle(data.title)
    } catch {
      // Silently ignore
    }
  }, [collectionId, scopedKey])

  // Load on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!collectionId) return

      try {
        const res = await fetch(`/api/collections/${collectionId}`)
        if (cancelled) return

        if (res.status === 403) {
          setNoAccess(true)
          setIsLoaded(true)
          return
        }

        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (cancelled) return

        if (data.access) {
          setAccess(data.access as CollectionAccessLevel)
          accessRef.current = data.access as CollectionAccessLevel
        }
        if (data.updatedAt) {
          revisionRef.current = String(data.updatedAt)
        }
        if (data.title) setTitle(data.title)
        if (data.projectId) setProjectId(data.projectId)

        if (data.payload && typeof data.payload === 'object' && Object.keys(data.payload).length > 0) {
          setStateInternal(data.payload as T)
          stateRef.current = data.payload as T
          try { localStorage.setItem(scopedKey, JSON.stringify(data.payload)) } catch {}
        } else {
          // DB empty — try localStorage fallback
          try {
            const stored = localStorage.getItem(scopedKey)
            if (stored) {
              const parsed = JSON.parse(stored) as T
              setStateInternal(parsed)
              stateRef.current = parsed
            } else {
              setStateInternal(defaultRef.current)
              stateRef.current = defaultRef.current
            }
          } catch {}
        }
      } catch {
        try {
          const stored = localStorage.getItem(scopedKey)
          if (stored) {
            const parsed = JSON.parse(stored) as T
            setStateInternal(parsed)
            stateRef.current = parsed
          }
        } catch {}
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, scopedKey])

  // Polling
  useEffect(() => {
    if (!collectionId || !isLoaded) return

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
    function handleFocus() { revalidate() }

    if (document.visibilityState === 'visible') startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [collectionId, isLoaded, revalidate])

  // Debounced save
  const saveToApi = useCallback(
    (payload: T) => {
      if (accessRef.current === 'VIEWER') return
      if (!collectionId) return

      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(async () => {
        setIsSyncing(true)
        const eventsToSend = pendingEventsRef.current.length > 0 ? [...pendingEventsRef.current] : undefined
        try {
          const res = await fetch(`/api/collections/${collectionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payload,
              revision: revisionRef.current,
              ...(eventsToSend && { events: eventsToSend }),
            }),
          })

          if (res.status === 409) {
            pendingEventsRef.current = []
            if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current)
            setConflictBanner(true)
            conflictTimerRef.current = setTimeout(() => setConflictBanner(false), 5000)
            await revalidate()
            return
          }

          if (res.ok) {
            pendingEventsRef.current = []
            const data = await res.json()
            if (data.updatedAt) revisionRef.current = String(data.updatedAt)
          }
        } catch {
          // Silent
        } finally {
          setIsSyncing(false)
        }
      }, 500)
    },
    [collectionId, revalidate]
  )

  const [viewOnlyAttempt, setViewOnlyAttempt] = useState(false)

  const setState = useCallback(
    (updater: (prev: T) => T, events?: ActivityEventHint[]) => {
      if (accessRef.current === 'VIEWER') {
        setViewOnlyAttempt(true)
        setTimeout(() => setViewOnlyAttempt(false), 3000)
        return
      }

      if (events && events.length > 0) {
        pendingEventsRef.current = [...pendingEventsRef.current, ...events]
      }

      setStateInternal((prev) => {
        const next = updater(prev)
        stateRef.current = next
        try { localStorage.setItem(scopedKey, JSON.stringify(next)) } catch {}
        saveToApi(next)
        return next
      })
    },
    [scopedKey, saveToApi]
  )

  const readOnly = access === 'VIEWER'

  return {
    state, setState, isLoaded, isSyncing, access, readOnly, noAccess,
    conflictBanner, viewOnlyAttempt, title, collectionId, projectId,
  }
}
