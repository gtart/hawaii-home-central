'use client'

import { useState } from 'react'

interface TransferRequest {
  sourceCollectionId: string
  destinationCollectionId: string
  operation: 'move' | 'copy'
  entityType: 'punchlist_item' | 'decision' | 'option'
  entityId: string
  sourceDecisionId?: string
  destinationRoomId?: string
  destinationDecisionId?: string
}

interface TransferResult {
  success: boolean
  entityId?: string
  destinationCollectionTitle?: string
  error?: string
}

export function useCollectionTransfer() {
  const [isTransferring, setIsTransferring] = useState(false)

  const transfer = async (req: TransferRequest): Promise<TransferResult> => {
    setIsTransferring(true)
    try {
      const res = await fetch('/api/collections/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Transfer failed' }
      }
      return {
        success: true,
        entityId: data.entityId,
        destinationCollectionTitle: data.destinationCollectionTitle,
      }
    } catch {
      return { success: false, error: 'Network error' }
    } finally {
      setIsTransferring(false)
    }
  }

  return { transfer, isTransferring }
}
