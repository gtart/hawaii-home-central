'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface CommentRow {
  id: string
  targetType: string
  targetId: string
  text: string
  authorUserId: string | null
  authorName: string
  authorEmail: string
  refEntityType: string | null
  refEntityId: string | null
  refEntityLabel: string | null
  parentCommentId: string | null
  createdAt: string
}

interface UseCommentsOptions {
  collectionId: string | null
  targetType: string
  targetId: string | null
  enabled?: boolean
}

interface UseCommentsReturn {
  comments: CommentRow[]
  isLoading: boolean
  addComment: (params: {
    text: string
    refEntityType?: string
    refEntityId?: string
    refEntityLabel?: string
  }) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
}

const POLL_INTERVAL = 20_000

export function useComments({
  collectionId,
  targetType,
  targetId,
  enabled = true,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<CommentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  const canFetch = enabled && !!collectionId && !!targetId

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!collectionId || !targetId) return
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/comments?targetType=${targetType}&targetId=${targetId}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (isMountedRef.current) {
        setComments(data.comments)
      }
    } catch {
      // Silent
    }
  }, [collectionId, targetType, targetId])

  // Initial load
  useEffect(() => {
    isMountedRef.current = true
    if (!canFetch) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setIsLoading(true)
      await fetchComments()
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => {
      cancelled = true
      isMountedRef.current = false
    }
  }, [canFetch, fetchComments])

  // Polling
  useEffect(() => {
    if (!canFetch) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    function startPolling() {
      stopPolling()
      intervalId = setInterval(fetchComments, POLL_INTERVAL)
    }
    function stopPolling() {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchComments()
        startPolling()
      } else {
        stopPolling()
      }
    }
    function handleFocus() { fetchComments() }

    if (document.visibilityState === 'visible') startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [canFetch, fetchComments])

  // Add comment (optimistic)
  const addComment = useCallback(
    async (params: {
      text: string
      refEntityType?: string
      refEntityId?: string
      refEntityLabel?: string
    }) => {
      if (!collectionId || !targetId) return

      // Optimistic placeholder
      const tempId = `temp_${Date.now()}`
      const optimistic: CommentRow = {
        id: tempId,
        targetType,
        targetId,
        text: params.text,
        authorUserId: null,
        authorName: '',
        authorEmail: '',
        refEntityType: params.refEntityType || null,
        refEntityId: params.refEntityId || null,
        refEntityLabel: params.refEntityLabel || null,
        parentCommentId: null,
        createdAt: new Date().toISOString(),
      }

      setComments((prev) => [...prev, optimistic])

      try {
        const res = await fetch(`/api/collections/${collectionId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType,
            targetId,
            text: params.text,
            refEntityType: params.refEntityType,
            refEntityId: params.refEntityId,
            refEntityLabel: params.refEntityLabel,
          }),
        })

        if (!res.ok) {
          // Rollback
          setComments((prev) => prev.filter((c) => c.id !== tempId))
          return
        }

        const data = await res.json()
        // Replace optimistic with real comment
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? data.comment : c))
        )
      } catch {
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== tempId))
      }
    },
    [collectionId, targetType, targetId]
  )

  // Delete comment (optimistic)
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!collectionId) return

      const removed = comments.find((c) => c.id === commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))

      try {
        const res = await fetch(
          `/api/collections/${collectionId}/comments?commentId=${commentId}`,
          { method: 'DELETE' }
        )
        if (!res.ok && removed) {
          // Rollback
          setComments((prev) => [...prev, removed].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ))
        }
      } catch {
        if (removed) {
          setComments((prev) => [...prev, removed].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ))
        }
      }
    },
    [collectionId, comments]
  )

  return { comments, isLoading, addComment, deleteComment }
}
