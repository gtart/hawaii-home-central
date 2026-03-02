'use client'

import { useCallback } from 'react'
import { useToolState } from '@/hooks/useToolState'
import { useCollectionState } from '@/hooks/useCollectionState'
import type { MoodBoardPayload, Board, Idea, IdeaImage, MoodBoardComment, ReactionType, BoardAccess } from '@/data/mood-boards'
import { DEFAULT_PAYLOAD, ensureDefaultBoard, genId, now } from '@/data/mood-boards'

/** Collection payload shape (version 2 — flat, one board per collection) */
interface MoodBoardCollectionPayload {
  version: 2
  legacyBoardId?: string
  ideas: Idea[]
  comments: MoodBoardComment[]
}

const DEFAULT_COLL_PAYLOAD: MoodBoardCollectionPayload = { version: 2, ideas: [], comments: [] }

function ensureShape(raw: unknown): MoodBoardPayload {
  if (
    raw &&
    typeof raw === 'object' &&
    'version' in raw &&
    (raw as MoodBoardPayload).version === 1
  ) {
    const p = raw as MoodBoardPayload
    return { ...p, boards: ensureDefaultBoard(Array.isArray(p.boards) ? p.boards : []) }
  }
  return { ...DEFAULT_PAYLOAD, boards: ensureDefaultBoard([]) }
}

export function useMoodBoardState() {
  const { state: rawState, setState, isLoaded, isSyncing, access, readOnly, noAccess } =
    useToolState<MoodBoardPayload>({
      toolKey: 'mood_boards',
      localStorageKey: 'hhc_mood_boards_v1',
      defaultValue: DEFAULT_PAYLOAD,
    })

  const payload = ensureShape(rawState)

  // ---- Board CRUD ----

  const addBoard = useCallback(
    (name: string, createdBy?: string) => {
      const id = genId('board')
      const ts = now()
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: [
            ...p.boards,
            { id, name, ideas: [], createdBy, createdAt: ts, updatedAt: ts },
          ],
        }
      })
      return id
    },
    [setState]
  )

  const renameBoard = useCallback(
    (boardId: string, name: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId ? { ...b, name, updatedAt: now() } : b
          ),
        }
      })
    },
    [setState]
  )

  const deleteBoard = useCallback(
    (boardId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        // Cannot delete the default board
        const board = p.boards.find((b) => b.id === boardId)
        if (board?.isDefault) return p
        return {
          ...p,
          boards: p.boards.filter((b) => b.id !== boardId),
        }
      })
    },
    [setState]
  )

  // ---- Idea CRUD ----

  const addIdea = useCallback(
    (
      boardId: string,
      idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
      const id = genId('idea')
      const ts = now()
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  ideas: [
                    ...b.ideas,
                    { ...idea, id, createdAt: ts, updatedAt: ts },
                  ],
                  updatedAt: ts,
                }
              : b
          ),
        }
      })
      return id
    },
    [setState]
  )

  const updateIdea = useCallback(
    (boardId: string, ideaId: string, updates: Partial<Idea>) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  ideas: b.ideas.map((idea) =>
                    idea.id === ideaId
                      ? { ...idea, ...updates, updatedAt: now() }
                      : idea
                  ),
                  updatedAt: now(),
                }
              : b
          ),
        }
      })
    },
    [setState]
  )

  const deleteIdea = useCallback(
    (boardId: string, ideaId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  ideas: b.ideas.filter((idea) => idea.id !== ideaId),
                  updatedAt: now(),
                }
              : b
          ),
        }
      })
    },
    [setState]
  )

  const moveIdea = useCallback(
    (fromBoardId: string, toBoardId: string, ideaId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        const fromBoard = p.boards.find((b) => b.id === fromBoardId)
        const idea = fromBoard?.ideas.find((i) => i.id === ideaId)
        if (!idea) return p

        const ts = now()
        return {
          ...p,
          boards: p.boards.map((b) => {
            if (b.id === fromBoardId) {
              return {
                ...b,
                ideas: b.ideas.filter((i) => i.id !== ideaId),
                updatedAt: ts,
              }
            }
            if (b.id === toBoardId) {
              return {
                ...b,
                ideas: [...b.ideas, { ...idea, updatedAt: ts }],
                updatedAt: ts,
              }
            }
            return b
          }),
        }
      })
    },
    [setState]
  )

  const copyIdea = useCallback(
    (fromBoardId: string, toBoardId: string, ideaId: string) => {
      const newId = genId('idea')
      setState((prev) => {
        const p = ensureShape(prev)
        const fromBoard = p.boards.find((b) => b.id === fromBoardId)
        const idea = fromBoard?.ideas.find((i) => i.id === ideaId)
        if (!idea) return p

        const ts = now()
        return {
          ...p,
          boards: p.boards.map((b) => {
            if (b.id === toBoardId) {
              return {
                ...b,
                ideas: [
                  ...b.ideas,
                  { ...idea, id: newId, reactions: [], createdAt: ts, updatedAt: ts },
                ],
                updatedAt: ts,
              }
            }
            return b
          }),
        }
      })
      return newId
    },
    [setState]
  )

  // ---- Comments ----

  const addComment = useCallback(
    (
      boardId: string,
      comment: {
        text: string
        authorName: string
        authorEmail: string
        refIdeaId?: string
        refIdeaLabel?: string
      }
    ) => {
      const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  comments: [
                    ...(b.comments || []),
                    { id, ...comment, createdAt: now() },
                  ],
                  updatedAt: now(),
                }
              : b
          ),
        }
      })
    },
    [setState]
  )

  const deleteComment = useCallback(
    (boardId: string, commentId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  comments: (b.comments || []).filter((c) => c.id !== commentId),
                  updatedAt: now(),
                }
              : b
          ),
        }
      })
    },
    [setState]
  )

  // ---- Reactions ----

  const toggleReaction = useCallback(
    (
      boardId: string,
      ideaId: string,
      userEmail: string,
      userName: string,
      reaction: ReactionType
    ) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) => {
            if (b.id !== boardId) return b
            return {
              ...b,
              ideas: b.ideas.map((idea) => {
                if (idea.id !== ideaId) return idea
                const existing = (idea.reactions || []).find(
                  (r) => r.userId === userEmail
                )
                let newReactions: typeof idea.reactions
                if (existing && existing.reaction === reaction) {
                  // Toggle off — remove
                  newReactions = (idea.reactions || []).filter(
                    (r) => r.userId !== userEmail
                  )
                } else {
                  // Replace or add
                  newReactions = [
                    ...(idea.reactions || []).filter(
                      (r) => r.userId !== userEmail
                    ),
                    { userId: userEmail, userName, reaction },
                  ]
                }
                return { ...idea, reactions: newReactions, updatedAt: now() }
              }),
              updatedAt: now(),
            }
          }),
        }
      })
    },
    [setState]
  )

  // ---- Restore (for undo delete) ----

  const restoreIdea = useCallback(
    (boardId: string, idea: Idea) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? { ...b, ideas: [...b.ideas, idea], updatedAt: now() }
              : b
          ),
        }
      })
    },
    [setState]
  )

  // ---- Board Access ----

  const updateBoardAccess = useCallback(
    (
      boardId: string,
      visibility: 'everyone' | 'invite-only',
      accessList: BoardAccess[]
    ) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          boards: p.boards.map((b) =>
            b.id === boardId
              ? { ...b, visibility, access: accessList, updatedAt: now() }
              : b
          ),
        }
      })
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
    addBoard,
    renameBoard,
    deleteBoard,
    addIdea,
    updateIdea,
    deleteIdea,
    restoreIdea,
    moveIdea,
    copyIdea,
    addComment,
    deleteComment,
    toggleReaction,
    updateBoardAccess,
  }
}

/**
 * Collection-based mood board state. Each collection IS a board.
 * Returns the same MoodBoardStateAPI shape for compatibility with BoardDetailView.
 */
export function useMoodBoardCollectionState(collectionId: string | null): MoodBoardStateAPI {
  const SYNTH_BOARD_ID = collectionId || '__none__'

  const {
    state: rawState,
    setState,
    isLoaded,
    isSyncing,
    access: rawAccess,
    readOnly: collReadOnly,
    noAccess,
    title: collTitle,
  } = useCollectionState<MoodBoardCollectionPayload>({
    collectionId: collectionId,
    toolKey: 'mood_boards',
    localStorageKey: `hhc_mood_boards_coll_${collectionId}`,
    defaultValue: DEFAULT_COLL_PAYLOAD,
  })

  // Map collection access to tool-level access string
  function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
    if (!a) return null
    if (a === 'EDITOR') return 'EDIT'
    if (a === 'VIEWER') return 'VIEW'
    return a as 'OWNER' | 'EDIT' | 'VIEW'
  }

  const access = mapAccess(rawAccess)
  const readOnly = collReadOnly

  // Build synthetic MoodBoardPayload with one board from the collection payload
  const coll = (rawState && typeof rawState === 'object' && 'ideas' in rawState)
    ? rawState as MoodBoardCollectionPayload
    : DEFAULT_COLL_PAYLOAD
  const ts = new Date().toISOString()
  const syntheticBoard: Board = {
    id: SYNTH_BOARD_ID,
    name: collTitle || 'Board',
    ideas: Array.isArray(coll.ideas) ? coll.ideas : [],
    comments: Array.isArray(coll.comments) ? coll.comments : [],
    isDefault: true,
    createdAt: ts,
    updatedAt: ts,
  }
  const payload: MoodBoardPayload = { version: 1, boards: [syntheticBoard] }

  // Wrap setState to map between flat collection payload and v1 boards structure
  function updateColl(updater: (prev: MoodBoardCollectionPayload) => MoodBoardCollectionPayload) {
    setState((prev) => {
      const p = (prev && typeof prev === 'object' && 'ideas' in prev)
        ? prev as unknown as MoodBoardCollectionPayload
        : DEFAULT_COLL_PAYLOAD
      return updater(p) as unknown as MoodBoardCollectionPayload
    })
  }

  // Board CRUD — no-ops in collection mode (boards = collections, managed by picker)
  const addBoard = useCallback((_name: string, _createdBy?: string) => SYNTH_BOARD_ID, [SYNTH_BOARD_ID])
  const renameBoard = useCallback((_boardId: string, _name: string) => {}, [])
  const deleteBoard = useCallback((_boardId: string) => {}, [])

  // Idea CRUD
  const addIdea = useCallback(
    (_boardId: string, idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = genId('idea')
      const t = now()
      updateColl((p) => ({
        ...p,
        ideas: [...p.ideas, { ...idea, id, createdAt: t, updatedAt: t } as Idea],
      }))
      return id
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  const updateIdea = useCallback(
    (_boardId: string, ideaId: string, updates: Partial<Idea>) => {
      updateColl((p) => ({
        ...p,
        ideas: p.ideas.map((i) =>
          i.id === ideaId ? { ...i, ...updates, updatedAt: now() } : i
        ),
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  const deleteIdea = useCallback(
    (_boardId: string, ideaId: string) => {
      updateColl((p) => ({
        ...p,
        ideas: p.ideas.filter((i) => i.id !== ideaId),
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  const restoreIdea = useCallback(
    (_boardId: string, idea: Idea) => {
      updateColl((p) => ({
        ...p,
        ideas: [...p.ideas, idea],
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  // Move/copy — no-ops in collection mode (each collection is one board)
  const moveIdea = useCallback((_from: string, _to: string, _id: string) => {}, [])
  const copyIdea = useCallback((_from: string, _to: string, _id: string) => '', [])

  // Comments
  const addComment = useCallback(
    (
      _boardId: string,
      comment: {
        text: string
        authorName: string
        authorEmail: string
        refIdeaId?: string
        refIdeaLabel?: string
      }
    ) => {
      const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      updateColl((p) => ({
        ...p,
        comments: [...(p.comments || []), { id, ...comment, createdAt: now() }],
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  const deleteComment = useCallback(
    (_boardId: string, commentId: string) => {
      updateColl((p) => ({
        ...p,
        comments: (p.comments || []).filter((c) => c.id !== commentId),
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  // Reactions
  const toggleReaction = useCallback(
    (
      _boardId: string,
      ideaId: string,
      userEmail: string,
      userName: string,
      reaction: ReactionType
    ) => {
      updateColl((p) => ({
        ...p,
        ideas: p.ideas.map((idea) => {
          if (idea.id !== ideaId) return idea
          const existing = (idea.reactions || []).find((r) => r.userId === userEmail)
          let newReactions: typeof idea.reactions
          if (existing && existing.reaction === reaction) {
            newReactions = (idea.reactions || []).filter((r) => r.userId !== userEmail)
          } else {
            newReactions = [
              ...(idea.reactions || []).filter((r) => r.userId !== userEmail),
              { userId: userEmail, userName, reaction },
            ]
          }
          return { ...idea, reactions: newReactions, updatedAt: now() }
        }),
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState]
  )

  // Board access — no-op (collection-level ACL managed via API)
  const updateBoardAccess = useCallback(
    (_boardId: string, _visibility: 'everyone' | 'invite-only', _accessList: BoardAccess[]) => {},
    []
  )

  return {
    payload,
    isLoaded,
    isSyncing,
    access,
    readOnly,
    noAccess,
    addBoard,
    renameBoard,
    deleteBoard,
    addIdea,
    updateIdea,
    deleteIdea,
    restoreIdea,
    moveIdea,
    copyIdea,
    addComment,
    deleteComment,
    toggleReaction,
    updateBoardAccess,
  }
}

export type MoodBoardStateAPI = ReturnType<typeof useMoodBoardState>
