'use client'

import { useCallback } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type { MoodBoardPayload, Board, Idea, IdeaImage, MoodBoardComment, ReactionType, BoardAccess } from '@/data/mood-boards'
import { DEFAULT_PAYLOAD, ensureDefaultBoard, genId, now } from '@/data/mood-boards'

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

export type MoodBoardStateAPI = ReturnType<typeof useMoodBoardState>
