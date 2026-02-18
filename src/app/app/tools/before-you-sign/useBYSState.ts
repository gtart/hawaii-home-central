'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type {
  BYSPayload,
  BYSContractor,
  BYSAnswer,
  TabKey,
  TriStatus,
} from './types'

const DEFAULT_PAYLOAD: BYSPayload = {
  version: 1,
  contractors: [],
  selectedContractorIds: [],
  answers: { quotes: {}, handoffs: {}, agree: {} },
  customAgreeItems: [],
}

function ensureShape(raw: unknown): BYSPayload {
  if (
    raw &&
    typeof raw === 'object' &&
    'version' in raw &&
    (raw as BYSPayload).version === 1
  ) {
    const p = raw as any

    // Migrate from old activeContractorId to selectedContractorIds
    let selectedContractorIds: string[] = []
    if (Array.isArray(p.selectedContractorIds)) {
      selectedContractorIds = p.selectedContractorIds
    } else if (typeof p.activeContractorId === 'string' && p.activeContractorId !== 'all') {
      selectedContractorIds = [p.activeContractorId]
    } else if (Array.isArray(p.contractors) && p.contractors.length > 0) {
      selectedContractorIds = [p.contractors[0].id]
    }

    return {
      ...DEFAULT_PAYLOAD,
      ...p,
      selectedContractorIds,
      answers: {
        quotes: p.answers?.quotes ?? {},
        handoffs: p.answers?.handoffs ?? {},
        agree: p.answers?.agree ?? {},
      },
    }
  }
  return DEFAULT_PAYLOAD
}

export function useBYSState() {
  const { state: rawState, setState, isLoaded, isSyncing } =
    useToolState<BYSPayload>({
      toolKey: 'before_you_sign',
      localStorageKey: 'hhc_before_you_sign_v1',
      defaultValue: DEFAULT_PAYLOAD,
    })

  const payload = ensureShape(rawState)
  const migrationRan = useRef(false)

  // Migration: import legacy agree items from localStorage
  useEffect(() => {
    if (!isLoaded || migrationRan.current) return
    migrationRan.current = true

    if (payload.customAgreeItems.length > 0 || payload.contractors.length > 0) {
      return // already has data, skip migration
    }

    try {
      const migrated = localStorage.getItem(
        'hhc_before_you_sign_notes_v1_migrated'
      )
      if (migrated === 'true') return

      const legacyJson = localStorage.getItem('hhc_before_you_sign_notes_v1')
      if (!legacyJson) return

      const legacy = JSON.parse(legacyJson) as {
        items?: Array<{ id: string; question: string }>
      }
      if (!legacy?.items?.length) return

      const customItems = legacy.items
        .filter((i) => i.id.startsWith('custom_'))
        .map((i) => ({ id: i.id, question: i.question }))

      if (customItems.length > 0) {
        setState((prev) => ({
          ...prev,
          customAgreeItems: [...prev.customAgreeItems, ...customItems],
        }))
      }

      localStorage.setItem('hhc_before_you_sign_notes_v1_migrated', 'true')
    } catch {
      // ignore migration errors
    }
  }, [isLoaded, payload.customAgreeItems.length, payload.contractors.length, setState])

  // ---- Contractor CRUD ----

  const addContractor = useCallback(
    (name: string) => {
      const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      setState((prev) => {
        const selectedContractorIds =
          prev.contractors.length === 0
            ? [id] // First contractor: auto-select
            : prev.selectedContractorIds.length < 4
            ? [...prev.selectedContractorIds, id] // Add to selection if < 4
            : prev.selectedContractorIds // Keep existing if at max

        return {
          ...prev,
          contractors: [...prev.contractors, { id, name, notes: '' }],
          selectedContractorIds,
        }
      })
      return id
    },
    [setState]
  )

  const updateContractor = useCallback(
    (id: string, updates: Partial<BYSContractor>) => {
      setState((prev) => ({
        ...prev,
        contractors: prev.contractors.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }))
    },
    [setState]
  )

  const removeContractor = useCallback(
    (id: string) => {
      setState((prev) => {
        const contractors = prev.contractors.filter((c) => c.id !== id)
        // Clean answers for removed contractor
        const answers = { ...prev.answers }
        for (const tab of ['quotes', 'handoffs', 'agree'] as TabKey[]) {
          if (answers[tab]?.[id]) {
            const tabAnswers = { ...answers[tab] }
            delete tabAnswers[id]
            answers[tab] = tabAnswers
          }
        }
        // Remove from selection and ensure at least 1 selected if contractors remain
        let selectedContractorIds = prev.selectedContractorIds.filter(
          (cId) => cId !== id
        )
        if (selectedContractorIds.length === 0 && contractors.length > 0) {
          selectedContractorIds = [contractors[0].id]
        }
        return { ...prev, contractors, answers, selectedContractorIds }
      })
    },
    [setState]
  )

  // ---- Contractor selection (multi-select) ----

  const toggleContractorSelection = useCallback(
    (id: string) => {
      setState((prev) => {
        const isSelected = prev.selectedContractorIds.includes(id)
        let selectedContractorIds: string[]

        if (isSelected) {
          // Deselecting: ensure at least 1 remains selected
          const newSelection = prev.selectedContractorIds.filter((cId) => cId !== id)
          if (newSelection.length === 0 && prev.contractors.length > 0) {
            // Don't allow deselecting the last one
            return prev
          }
          selectedContractorIds = newSelection
        } else {
          // Selecting: enforce max 4
          if (prev.selectedContractorIds.length >= 4) {
            return prev
          }
          selectedContractorIds = [...prev.selectedContractorIds, id]
        }

        return { ...prev, selectedContractorIds }
      })
    },
    [setState]
  )

  // ---- Answers ----

  const setAnswer = useCallback(
    (
      tab: TabKey,
      contractorId: string,
      itemId: string,
      answer: Partial<BYSAnswer>
    ) => {
      setState((prev) => {
        const existing: BYSAnswer = prev.answers[tab]?.[contractorId]?.[
          itemId
        ] ?? { status: 'unknown' as TriStatus, notes: '' }
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [tab]: {
              ...prev.answers[tab],
              [contractorId]: {
                ...prev.answers[tab]?.[contractorId],
                [itemId]: { ...existing, ...answer },
              },
            },
          },
        }
      })
    },
    [setState]
  )

  const getAnswer = useCallback(
    (tab: TabKey, contractorId: string, itemId: string): BYSAnswer => {
      return (
        payload.answers[tab]?.[contractorId]?.[itemId] ?? {
          status: 'unknown',
          notes: '',
        }
      )
    },
    [payload.answers]
  )

  // ---- Custom agree items ----

  const addCustomAgreeItem = useCallback(
    (question: string) => {
      const id = `custom_${Date.now()}`
      setState((prev) => ({
        ...prev,
        customAgreeItems: [...prev.customAgreeItems, { id, question }],
      }))
      return id
    },
    [setState]
  )

  const removeCustomAgreeItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const agree = { ...prev.answers.agree }
        // Remove this item from all contractor answer maps
        for (const cId of Object.keys(agree)) {
          if (agree[cId]?.[id]) {
            const contractorAnswers = { ...agree[cId] }
            delete contractorAnswers[id]
            agree[cId] = contractorAnswers
          }
        }
        return {
          ...prev,
          customAgreeItems: prev.customAgreeItems.filter((i) => i.id !== id),
          answers: { ...prev.answers, agree },
        }
      })
    },
    [setState]
  )

  return {
    payload,
    isLoaded,
    isSyncing,
    addContractor,
    updateContractor,
    removeContractor,
    toggleContractorSelection,
    setAnswer,
    getAnswer,
    addCustomAgreeItem,
    removeCustomAgreeItem,
  }
}

export type BYSStateAPI = ReturnType<typeof useBYSState>
