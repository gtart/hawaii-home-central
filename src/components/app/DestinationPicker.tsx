'use client'

import { useState, useEffect } from 'react'

type PickerStep = 'collection' | 'room' | 'decision'

interface CollectionOption {
  id: string
  title: string
}

interface RoomOption {
  id: string
  name: string
  type?: string
}

interface DecisionOption {
  id: string
  title: string
}

interface DestinationResult {
  collectionId: string
  collectionTitle: string
  roomId?: string
  decisionId?: string
}

interface DestinationPickerProps {
  toolKey: 'finish_decisions' | 'punchlist' | 'mood_boards'
  projectId: string
  excludeCollectionId?: string
  requireRoom?: boolean
  requireDecision?: boolean
  actionLabel: string
  title: string
  onConfirm: (dest: DestinationResult) => void
  onClose: () => void
}

export function DestinationPicker({
  toolKey,
  projectId,
  excludeCollectionId,
  requireRoom,
  requireDecision,
  actionLabel,
  title,
  onConfirm,
  onClose,
}: DestinationPickerProps) {
  const [step, setStep] = useState<PickerStep>('collection')
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [selectedCollection, setSelectedCollection] = useState<CollectionOption | null>(null)
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null)
  const [decisions, setDecisions] = useState<DecisionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Fetch collections
  useEffect(() => {
    setLoading(true)
    fetch(`/api/collections?projectId=${projectId}&toolKey=${toolKey}`)
      .then((res) => res.json())
      .then((data) => {
        const colls = ((data.collections || []) as { id: string; title: string }[])
          .filter((c) => c.id !== excludeCollectionId)
          .map((c) => ({ id: c.id, title: c.title }))
        setCollections(colls)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load lists')
        setLoading(false)
      })
  }, [projectId, toolKey, excludeCollectionId])

  function handleCollectionSelect(coll: CollectionOption) {
    setSelectedCollection(coll)
    setError('')
    if (requireRoom || requireDecision) {
      // Need to fetch payload for rooms
      setStep('room')
      setLoading(true)
      fetch(`/api/collections/${coll.id}`)
        .then((res) => res.json())
        .then((data) => {
          const payload = data.payload as Record<string, unknown>
          const payloadRooms = (payload?.rooms || []) as Array<{
            id: string
            name: string
            type?: string
            systemKey?: string
          }>
          setRooms(
            payloadRooms
              .filter((r) => r.systemKey !== 'global_uncategorized')
              .map((r) => ({ id: r.id, name: r.name, type: r.type }))
          )
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load rooms')
          setLoading(false)
        })
    } else {
      // No drill-down needed — confirm immediately
      onConfirm({ collectionId: coll.id, collectionTitle: coll.title })
    }
  }

  function handleRoomSelect(room: RoomOption) {
    setSelectedRoom(room)
    setError('')
    if (requireDecision) {
      // Load decisions for this room from the already-fetched payload
      // We need to re-fetch since we don't store the full payload
      setStep('decision')
      setLoading(true)
      fetch(`/api/collections/${selectedCollection!.id}`)
        .then((res) => res.json())
        .then((data) => {
          const payload = data.payload as Record<string, unknown>
          const payloadRooms = (payload?.rooms || []) as Array<{
            id: string
            decisions: Array<{ id: string; title?: string; systemKey?: string }>
          }>
          const targetRoom = payloadRooms.find((r) => r.id === room.id)
          const decs = (targetRoom?.decisions || [])
            .filter((d) => d.systemKey !== 'uncategorized')
            .map((d) => ({ id: d.id, title: d.title || 'Untitled' }))
          setDecisions(decs)
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load selections')
          setLoading(false)
        })
    } else {
      // Room is the final step
      onConfirm({
        collectionId: selectedCollection!.id,
        collectionTitle: selectedCollection!.title,
        roomId: room.id,
      })
    }
  }

  function handleDecisionSelect(dec: DecisionOption) {
    onConfirm({
      collectionId: selectedCollection!.id,
      collectionTitle: selectedCollection!.title,
      roomId: selectedRoom!.id,
      decisionId: dec.id,
    })
  }

  function handleBack() {
    setError('')
    if (step === 'decision') {
      setSelectedRoom(null)
      setStep('room')
    } else if (step === 'room') {
      setSelectedCollection(null)
      setStep('collection')
    }
  }

  const stepTitle =
    step === 'collection' ? title
    : step === 'room' ? `${actionLabel} to room in ${selectedCollection?.title}`
    : `Choose selection`

  const content = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'collection' && (
              <button
                type="button"
                onClick={handleBack}
                className="text-cream/40 hover:text-cream transition-colors -ml-1 p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-medium text-cream">{stepTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-cream/20 border-t-sandstone rounded-full animate-spin" />
            <span className="text-sm text-cream/50">Loading...</span>
          </div>
        )}

        {/* Collection step */}
        {step === 'collection' && !loading && (
          <div className="space-y-2">
            {collections.length === 0 && !error && (
              <p className="text-sm text-cream/40 text-center py-4">
                No other lists found. Create another list first.
              </p>
            )}
            {collections.map((coll) => (
              <button
                key={coll.id}
                type="button"
                onClick={() => handleCollectionSelect(coll)}
                className="w-full flex items-center justify-between p-3 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <span className="text-sm text-cream truncate">{coll.title}</span>
                <svg className="w-4 h-4 text-cream/20 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Room step */}
        {step === 'room' && !loading && (
          <div className="space-y-2">
            {rooms.length === 0 && !error && (
              <p className="text-sm text-cream/40 text-center py-4">
                No rooms found in this list.
              </p>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => handleRoomSelect(room)}
                className="w-full flex items-center justify-between p-3 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <span className="text-sm text-cream truncate">{room.name}</span>
                <svg className="w-4 h-4 text-cream/20 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Decision step */}
        {step === 'decision' && !loading && (
          <div className="space-y-2">
            {decisions.length === 0 && !error && (
              <p className="text-sm text-cream/40 text-center py-4">
                No selections found in this room.
              </p>
            )}
            {decisions.map((dec) => (
              <button
                key={dec.id}
                type="button"
                onClick={() => handleDecisionSelect(dec)}
                className="w-full flex items-center justify-between p-3 bg-cream/5 border border-cream/10 rounded-lg hover:bg-cream/8 transition-colors text-left"
              >
                <span className="text-sm text-cream truncate">{dec.title}</span>
                <svg className="w-4 h-4 text-cream/20 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[56] items-center justify-center pointer-events-none">
        <div
          className="w-full max-w-md bg-basalt-50 border border-cream/10 rounded-xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/10 rounded-t-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-cream/15 rounded-full" />
        </div>
        {content}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  )
}
