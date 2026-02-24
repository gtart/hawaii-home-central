'use client'

import { useCallback } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type {
  PunchlistPayload,
  PunchlistItem,
  PunchlistPhoto,
  PunchlistStatus,
  PunchlistPriority,
  PunchlistComment,
} from './types'

const DEFAULT_PAYLOAD: PunchlistPayload = {
  version: 3,
  nextItemNumber: 1,
  items: [],
}

interface V1Payload {
  version: 1
  items: Array<Omit<PunchlistItem, 'itemNumber'> & { itemNumber?: number; status: string }>
}

/** Remap old IN_PROGRESS status to ACCEPTED */
function migrateStatus(status: string): PunchlistStatus {
  if (status === 'IN_PROGRESS') return 'ACCEPTED'
  return status as PunchlistStatus
}

function ensureShape(raw: unknown): PunchlistPayload {
  if (!raw || typeof raw !== 'object' || !('version' in raw)) return DEFAULT_PAYLOAD

  const obj = raw as Record<string, unknown>

  // v3 — current format
  if (
    obj.version === 3 &&
    typeof obj.nextItemNumber === 'number' &&
    Array.isArray(obj.items)
  ) {
    return raw as PunchlistPayload
  }

  // v2 → v3 migration: remap IN_PROGRESS → ACCEPTED
  if (
    obj.version === 2 &&
    typeof obj.nextItemNumber === 'number' &&
    Array.isArray(obj.items)
  ) {
    const items = (obj.items as Array<PunchlistItem & { status: string }>).map((item) => ({
      ...item,
      status: migrateStatus(item.status),
    }))
    return {
      version: 3,
      nextItemNumber: obj.nextItemNumber as number,
      items,
    }
  }

  // v1 → v3 migration: assign item numbers + remap statuses
  if (obj.version === 1 && Array.isArray(obj.items)) {
    const v1 = raw as V1Payload
    const sorted = [...v1.items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const migrated: PunchlistItem[] = sorted.map((item, i) => ({
      ...item,
      itemNumber: i + 1,
      status: migrateStatus(item.status),
    }))
    return {
      version: 3,
      nextItemNumber: migrated.length + 1,
      items: migrated,
    }
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
      createdByName?: string
      createdByEmail?: string
    }) => {
      const id = genId('pl')
      const ts = now()
      setState((prev) => ({
        ...prev,
        nextItemNumber: prev.nextItemNumber + 1,
        items: [
          ...prev.items,
          {
            id,
            itemNumber: prev.nextItemNumber,
            title: item.title,
            location: item.location,
            status: 'OPEN' as PunchlistStatus,
            assigneeLabel: item.assigneeLabel,
            priority: item.priority,
            notes: item.notes,
            photos: item.photos,
            createdByName: item.createdByName,
            createdByEmail: item.createdByEmail,
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

  // ---- Comment management ----

  const addComment = useCallback(
    (itemId: string, comment: { text: string; authorName: string; authorEmail: string }) => {
      const id = genId('cmt')
      const ts = now()
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                comments: [
                  ...(item.comments || []),
                  { id, text: comment.text, authorName: comment.authorName, authorEmail: comment.authorEmail, createdAt: ts },
                ],
                updatedAt: ts,
              }
            : item
        ),
      }))
      return id
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
    addComment,
  }
}

export type PunchlistStateAPI = ReturnType<typeof usePunchlistState>
