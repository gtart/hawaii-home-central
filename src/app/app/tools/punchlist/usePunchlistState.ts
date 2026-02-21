'use client'

import { useCallback } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type {
  PunchlistPayload,
  PunchlistItem,
  PunchlistPhoto,
  PunchlistStatus,
  PunchlistPriority,
} from './types'

const DEFAULT_PAYLOAD: PunchlistPayload = {
  version: 1,
  items: [],
}

function ensureShape(raw: unknown): PunchlistPayload {
  if (
    raw &&
    typeof raw === 'object' &&
    'version' in raw &&
    (raw as PunchlistPayload).version === 1 &&
    Array.isArray((raw as PunchlistPayload).items)
  ) {
    return raw as PunchlistPayload
  }
  return DEFAULT_PAYLOAD
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function now() {
  return new Date().toISOString()
}

export function usePunchlistState() {
  const { state: rawState, setState, isLoaded, isSyncing, access, readOnly, noAccess } =
    useToolState<PunchlistPayload>({
      toolKey: 'punchlist',
      localStorageKey: 'hhc_punchlist_v1',
      defaultValue: DEFAULT_PAYLOAD,
    })

  const payload = ensureShape(rawState)

  // ---- Item CRUD ----

  const addItem = useCallback(
    (item: {
      title: string
      location: string
      assigneeLabel: string
      priority?: PunchlistPriority
      notes?: string
      photos: PunchlistPhoto[]
    }) => {
      const id = genId('pl')
      const ts = now()
      setState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            id,
            title: item.title,
            location: item.location,
            status: 'OPEN' as PunchlistStatus,
            assigneeLabel: item.assigneeLabel,
            priority: item.priority,
            notes: item.notes,
            photos: item.photos,
            createdAt: ts,
            updatedAt: ts,
          },
        ],
      }))
      return id
    },
    [setState]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<PunchlistItem, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: now() } : item
        ),
      }))
    },
    [setState]
  )

  const deleteItem = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }))
    },
    [setState]
  )

  // ---- Status management ----

  const setStatus = useCallback(
    (id: string, status: PunchlistStatus) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== id) return item
          return {
            ...item,
            status,
            updatedAt: now(),
            completedAt: status === 'DONE' ? now() : undefined,
          }
        }),
      }))
    },
    [setState]
  )

  // ---- Photo management ----

  const addPhoto = useCallback(
    (itemId: string, photo: PunchlistPhoto) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? { ...item, photos: [...item.photos, photo], updatedAt: now() }
            : item
        ),
      }))
    },
    [setState]
  )

  const removePhoto = useCallback(
    (itemId: string, photoId: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photos: item.photos.filter((p) => p.id !== photoId),
                updatedAt: now(),
              }
            : item
        ),
      }))
    },
    [setState]
  )

  return {
    payload,
    isLoaded,
    isSyncing,
    access,
    readOnly,
    noAccess,
    addItem,
    updateItem,
    deleteItem,
    setStatus,
    addPhoto,
    removePhoto,
  }
}

export type PunchlistStateAPI = ReturnType<typeof usePunchlistState>
