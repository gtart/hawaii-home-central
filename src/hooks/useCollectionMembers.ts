'use client'

import { useState, useEffect } from 'react'

export interface CollectionMember {
  id: string
  name: string | null
  image: string | null
}

/**
 * Fetches the list of users who have access to a collection.
 * Used by the MentionPicker for @user mentions in comments.
 */
export function useCollectionMembers(collectionId: string | undefined) {
  const [members, setMembers] = useState<CollectionMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!collectionId) return

    let cancelled = false
    setIsLoading(true)

    fetch(`/api/collections/${collectionId}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setMembers(data.members ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [collectionId])

  return { members, isLoading }
}
