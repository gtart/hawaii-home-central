'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionsPayloadV3, OptionV3, RoomV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, type RoomTypeV3 } from '@/data/finish-decisions'
import {
  ensureUncategorizedDecision,
  findUncategorizedDecision,
  ensureGlobalUnsortedRoom,
  findGlobalUnsortedRoom,
  isGlobalUnsorted,
} from '@/lib/decisionHelpers'
import type { MoodBoardPayload } from '@/data/mood-boards'
import { DEFAULT_PAYLOAD as DEFAULT_MB_PAYLOAD, ensureDefaultBoard, findDefaultBoard, genId } from '@/data/mood-boards'
import { BookmarkletButton } from '@/app/app/tools/finish-decisions/components/BookmarkletButton'
import { ImportFromUrlPanel } from '@/app/app/tools/finish-decisions/components/ImportFromUrlPanel'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import type { OptionImageV3 } from '@/data/finish-decisions'

const DEFAULT_FD_PAYLOAD: FinishDecisionsPayloadV3 = { version: 3, rooms: [] }
const BOOKMARKLET_STORAGE_KEY = 'hhc_bookmarklet_pending'
const LAST_ROOM_KEY = 'hhc_save_last_room'

type Destination = 'mood_boards' | 'finish_decisions'

interface BookmarkletData {
  title: string
  images: Array<{ url: string; label?: string }>
  url: string
}

export function SaveFromWebContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { currentProject, projects, isLoading: projectsLoading } = useProject()

  // Finish Decisions state
  const { state: fdState, setState: setFdState, isLoaded: fdLoaded, readOnly: fdReadOnly } =
    useToolState<FinishDecisionsPayloadV3>({
      toolKey: 'finish_decisions',
      localStorageKey: 'hhc_finish_decisions_v2',
      defaultValue: DEFAULT_FD_PAYLOAD,
    })

  // Mood Boards state
  const { state: mbState, setState: setMbState, isLoaded: mbLoaded, readOnly: mbReadOnly } =
    useToolState<MoodBoardPayload>({
      toolKey: 'mood_boards',
      localStorageKey: 'hhc_mood_boards_v1',
      defaultValue: DEFAULT_MB_PAYLOAD,
    })

  const isLoaded = fdLoaded && mbLoaded
  const readOnly = fdReadOnly && mbReadOnly

  // Determine initial destination from query params
  const fromParam = searchParams.get('from')
  const boardIdParam = searchParams.get('boardId')

  const [destination, setDestination] = useState<Destination | null>(
    fromParam === 'mood-boards' ? 'mood_boards' : null
  )
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(boardIdParam)
  const [saved, setSaved] = useState(false)
  const [savedDestination, setSavedDestination] = useState<Destination>('mood_boards')
  const [savedTargetRoom, setSavedTargetRoom] = useState<string>('')
  const [savedTargetRoomId, setSavedTargetRoomId] = useState<string>('')
  const [savedTargetDecision, setSavedTargetDecision] = useState<string>('')
  const [savedDecisionId, setSavedDecisionId] = useState<string>('')
  const [savedBoardName, setSavedBoardName] = useState<string>('')
  const [savedBoardId, setSavedBoardId] = useState<string>('')
  const [bookmarkletData, setBookmarkletData] = useState<BookmarkletData | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [urlImportOpen, setUrlImportOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)

  // Handle URL import from the paste-a-link panel
  const handleUrlImport = (result: { name: string; notes: string; sourceUrl: string; selectedImages: OptionImageV3[] }) => {
    setBookmarkletData({
      title: result.name,
      images: result.selectedImages.map((img) => ({ url: img.url, label: img.label })),
      url: result.sourceUrl,
    })
    setName(result.name)
    setNotes(result.notes)
    setSelectedUrls(new Set(result.selectedImages.map((img) => img.url)))
    setUrlImportOpen(false)
  }

  // Parse bookmarklet data from sessionStorage or hash fragment
  useEffect(() => {
    let payload: string | null = null

    try {
      payload = sessionStorage.getItem(BOOKMARKLET_STORAGE_KEY)
      if (payload) sessionStorage.removeItem(BOOKMARKLET_STORAGE_KEY)
    } catch { /* ignore */ }

    if (!payload) {
      const hash = window.location.hash
      if (hash.startsWith('#bookmarklet=')) {
        try {
          const b64 = hash.slice('#bookmarklet='.length)
          payload = decodeURIComponent(escape(atob(b64)))
        } catch { /* ignore */ }
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    if (!payload) return

    try {
      const data = JSON.parse(payload) as BookmarkletData
      if (data.url && Array.isArray(data.images)) {
        setBookmarkletData(data)
        setName(data.title || '')
      }
    } catch { /* ignore malformed data */ }
  }, [])

  const fdRooms = (fdState as FinishDecisionsPayloadV3).rooms || []
  const selectedRoom = fdRooms.find((r) => r.id === selectedRoomId)

  const mbBoards = ensureDefaultBoard(
    (mbState as MoodBoardPayload).boards || []
  )

  // Stable representation of room IDs
  const roomIdKey = fdRooms.map((r) => r.id).join(',')

  // Pre-select from query params or last-used room (Finish Selections)
  useEffect(() => {
    if (!isLoaded || fdRooms.length === 0 || destination !== 'finish_decisions') return
    if (selectedRoomId && fdRooms.find((r) => r.id === selectedRoomId)) return

    const qRoom = searchParams.get('roomId')
    const qDecision = searchParams.get('decisionId')
    if (qRoom && fdRooms.find((r) => r.id === qRoom)) {
      setSelectedRoomId(qRoom)
      if (qDecision) {
        const room = fdRooms.find((r) => r.id === qRoom)
        if (room?.decisions.find((d) => d.id === qDecision)) {
          setSelectedDecisionId(qDecision)
        }
      }
      return
    }

    try {
      const lastRoom = localStorage.getItem(LAST_ROOM_KEY)
      if (lastRoom && fdRooms.find((r) => r.id === lastRoom)) {
        setSelectedRoomId(lastRoom)
        return
      }
    } catch { /* ignore */ }

    if (fdRooms.length === 1) {
      setSelectedRoomId(fdRooms[0].id)
    }
  }, [isLoaded, roomIdKey, searchParams, selectedRoomId, fdRooms, destination])

  // Persist last-used room
  useEffect(() => {
    if (selectedRoomId) {
      try { localStorage.setItem(LAST_ROOM_KEY, selectedRoomId) } catch { /* ignore */ }
    }
  }, [selectedRoomId])

  const proxyUrl = (imgUrl: string) =>
    `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`

  const toggleImage = (imgUrl: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      if (next.has(imgUrl)) next.delete(imgUrl)
      else next.add(imgUrl)
      return next
    })
  }

  // ── Save to Mood Boards ──
  const handleSaveMoodBoard = () => {
    if (!bookmarkletData) return

    const images = bookmarkletData.images
      .filter((img) => selectedUrls.has(img.url))
      .map((img) => ({
        id: genId('img'),
        url: img.url,
        label: img.label,
        sourceUrl: bookmarkletData.url,
      }))

    const ts = new Date().toISOString()
    const ideaId = genId('idea')

    // Determine target board
    let targetBoardId = selectedBoardId
    const currentBoards = ensureDefaultBoard((mbState as MoodBoardPayload).boards || [])

    // Validate board still exists
    if (targetBoardId && !currentBoards.find((b) => b.id === targetBoardId)) {
      targetBoardId = null
    }

    // Default to "Saved Ideas"
    if (!targetBoardId) {
      const defaultBoard = findDefaultBoard(currentBoards)
      targetBoardId = defaultBoard?.id || 'board_saved_ideas'
    }

    const targetBoard = currentBoards.find((b) => b.id === targetBoardId)
    const boardName = targetBoard?.name || 'Saved Ideas'

    setMbState((prev) => {
      const p = prev as MoodBoardPayload
      let boards = ensureDefaultBoard(Array.isArray(p.boards) ? p.boards : [])

      boards = boards.map((b) => {
        if (b.id !== targetBoardId) return b
        return {
          ...b,
          ideas: [
            ...b.ideas,
            {
              id: ideaId,
              name: name.trim() || bookmarkletData.title || 'Imported idea',
              notes: notes.trim(),
              images,
              heroImageId: images[0]?.id || null,
              sourceUrl: bookmarkletData.url,
              sourceTitle: bookmarkletData.title || '',
              tags: [],
              createdAt: ts,
              updatedAt: ts,
            },
          ],
          updatedAt: ts,
        }
      })

      return { ...p, boards }
    })

    setSavedDestination('mood_boards')
    setSavedBoardName(boardName)
    setSavedBoardId(targetBoardId || '')
    setSaved(true)
  }

  // ── Save to Finish Selections ──
  const handleSaveFinishSelections = () => {
    if (!bookmarkletData) return

    const images = bookmarkletData.images
      .filter((img) => selectedUrls.has(img.url))
      .map((img) => ({
        id: crypto.randomUUID(),
        url: img.url,
        label: img.label,
        sourceUrl: bookmarkletData.url,
      }))

    const newOption: OptionV3 = {
      id: crypto.randomUUID(),
      name: name.trim() || bookmarkletData.title || 'Imported idea',
      notes: notes.trim(),
      urls: [{ id: crypto.randomUUID(), url: bookmarkletData.url }],
      kind: images.length > 0 ? 'image' : 'text',
      images: images.length > 0 ? images : undefined,
      heroImageId: images[0]?.id || null,
      imageUrl: images[0]?.url,
      thumbnailUrl: images[0]?.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let resolvedRoomId = selectedRoomId
    let resolvedDecisionId = selectedDecisionId
    let resolvedRoomName = ''
    let resolvedDecisionName = ''

    const currentRooms = (fdState as FinishDecisionsPayloadV3).rooms

    if (resolvedRoomId && !currentRooms.find((r) => r.id === resolvedRoomId)) {
      resolvedRoomId = null
      resolvedDecisionId = null
    }

    if (resolvedRoomId && resolvedDecisionId) {
      const targetRoom = currentRooms.find((r) => r.id === resolvedRoomId)
      if (!targetRoom?.decisions.find((d) => d.id === resolvedDecisionId)) {
        resolvedDecisionId = null
      }
    }

    if (!resolvedRoomId) {
      const ensured = ensureGlobalUnsortedRoom(currentRooms)
      const globalRoom = findGlobalUnsortedRoom(ensured)!
      resolvedRoomId = globalRoom.id
      resolvedRoomName = 'Unsorted'
      const uncat = findUncategorizedDecision(globalRoom)!
      resolvedDecisionId = uncat.id
      resolvedDecisionName = 'Uncategorized'
    } else {
      const targetRoom = currentRooms.find((r) => r.id === resolvedRoomId)
      resolvedRoomName = targetRoom?.name || 'Unknown'
      if (!resolvedDecisionId && targetRoom) {
        const withUncat = ensureUncategorizedDecision(targetRoom)
        const uncat = findUncategorizedDecision(withUncat)!
        resolvedDecisionId = uncat.id
        resolvedDecisionName = 'Uncategorized'
      } else if (resolvedDecisionId && targetRoom) {
        const dec = targetRoom.decisions.find((d) => d.id === resolvedDecisionId)
        resolvedDecisionName = dec?.title || ''
      }
    }

    setFdState((prev) => {
      const payload = prev as FinishDecisionsPayloadV3
      let updatedRooms = payload.rooms

      if (!selectedRoomId) {
        updatedRooms = ensureGlobalUnsortedRoom(updatedRooms)
      }

      const newRooms = updatedRooms.map((r) => {
        if (r.id !== resolvedRoomId) return r
        let room = r
        if (!selectedDecisionId) {
          room = ensureUncategorizedDecision(room)
        }
        return {
          ...room,
          decisions: room.decisions.map((d) =>
            d.id === resolvedDecisionId
              ? { ...d, options: [...d.options, newOption], updatedAt: new Date().toISOString() }
              : d
          ),
          updatedAt: new Date().toISOString(),
        }
      })
      return { ...payload, rooms: newRooms }
    })

    setSavedDestination('finish_decisions')
    setSavedTargetRoom(resolvedRoomName)
    setSavedTargetRoomId(resolvedRoomId || '')
    setSavedTargetDecision(resolvedDecisionName)
    setSavedDecisionId(resolvedDecisionId || '')
    setSaved(true)
  }

  const handleSave = () => {
    if (destination === 'mood_boards') handleSaveMoodBoard()
    else handleSaveFinishSelections()
  }

  const handleCreateBoard = () => {
    const trimmed = newBoardName.trim()
    if (!trimmed) return
    const id = genId('board')
    const ts = new Date().toISOString()
    setMbState((prev) => {
      const p = prev as MoodBoardPayload
      const boards = ensureDefaultBoard(Array.isArray(p.boards) ? p.boards : [])
      return {
        ...p,
        boards: [...boards, { id, name: trimmed, ideas: [], createdAt: ts, updatedAt: ts }],
      }
    })
    setSelectedBoardId(id)
    setNewBoardName('')
    setIsCreatingBoard(false)
  }

  // Extract hostname for display
  const sourceHost = bookmarkletData?.url
    ? (() => { try { return new URL(bookmarkletData.url).hostname.replace(/^www\./, '') } catch { return '' } })()
    : ''

  // Back link destination
  const backHref = fromParam === 'mood-boards'
    ? '/app/tools/mood-boards'
    : '/app/tools/finish-decisions'
  const backLabel = fromParam === 'mood-boards'
    ? 'Back to Mood Boards'
    : 'Back to Selection Boards'

  // Loading states
  if (projectsLoading || !isLoaded) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          <div className="h-8 w-48 bg-cream/10 rounded animate-pulse mb-4" />
          <div className="h-4 w-64 bg-cream/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-cream/60">No project found. Create a project first.</p>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="mt-4 text-sandstone hover:text-sandstone-light transition-colors text-sm"
          >
            &larr; Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-cream/60">You have view-only access to this project.</p>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="mt-4 text-sandstone hover:text-sandstone-light transition-colors text-sm"
          >
            &larr; Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Success state ──
  if (saved) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="font-serif text-2xl text-sandstone mb-2">Idea saved!</h1>

          {savedDestination === 'mood_boards' ? (
            <>
              <p className="text-cream/60 text-sm mb-6">
                Added to <span className="text-cream/80">{savedBoardName}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSaved(false)
                    setBookmarkletData(null)
                    setSelectedUrls(new Set())
                    setName('')
                    setNotes('')
                    setDestination(null)
                  }}
                  className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                >
                  Save another
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/app/tools/mood-boards?board=${savedBoardId}`)}
                  className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                >
                  View Board
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-cream/60 text-sm mb-6">
                Added to <span className="text-cream/80">{savedTargetDecision}</span> in <span className="text-cream/80">{savedTargetRoom}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSaved(false)
                    setBookmarkletData(null)
                    setSelectedUrls(new Set())
                    setName('')
                    setNotes('')
                    setDestination(null)
                  }}
                  className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                >
                  Save another
                </button>
                {savedTargetRoomId && (
                  <button
                    type="button"
                    data-testid="savefromweb-success-open-room"
                    onClick={() => router.push(`/app/tools/finish-decisions/room/${savedTargetRoomId}`)}
                    className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                  >
                    View in {savedTargetRoom}
                  </button>
                )}
                {savedDecisionId && (
                  <button
                    type="button"
                    data-testid="savefromweb-success-open-selection"
                    onClick={() => router.push(`/app/tools/finish-decisions/decision/${savedDecisionId}`)}
                    className="px-4 py-2 text-sm text-sandstone hover:text-sandstone-light border border-sandstone/30 rounded-lg transition-colors"
                  >
                    View selection
                  </button>
                )}
                {!savedTargetRoomId && !savedDecisionId && (
                  <button
                    type="button"
                    onClick={() => router.push('/app/tools/finish-decisions')}
                    className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                  >
                    Go to Selection Boards
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const canSave = !!name.trim() && !!bookmarkletData && !!destination

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; {backLabel}
        </button>

        <h1 className="font-serif text-2xl md:text-3xl text-sandstone mb-2">
          Save to HHC
        </h1>

        {/* ── No bookmarklet data: show setup instructions ── */}
        {!bookmarkletData && (
          <>
            <p className="text-cream/60 text-sm mb-6">
              Save inspiration from any website — to your Mood Boards or Finish Selections.
            </p>

            <div data-testid="empty-state-savefromweb" className="bg-basalt-50 rounded-xl p-5 border border-cream/10">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">1</span>
                  <div>
                    <p className="text-sm text-cream/80 mb-2">Drag this button to your bookmarks bar:</p>
                    <BookmarkletButton />
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">2</span>
                  <div>
                    <p className="text-sm text-cream/80">Visit any product or inspiration page</p>
                    <p className="text-xs text-cream/40 mt-0.5">Home Depot, Lowes, Wayfair, Amazon, Pinterest, Houzz, etc.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">3</span>
                  <div>
                    <p className="text-sm text-cream/80">Click &quot;Save to HHC&quot; in your bookmarks bar</p>
                    <p className="text-xs text-cream/40 mt-0.5">Choose Mood Boards (inspiration) or Finish Selections (decisions).</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-cream/10">
                <p className="text-[11px] text-cream/30">
                  The bookmarklet works on desktop browsers (Chrome, Firefox, Safari, Edge).
                </p>
              </div>
            </div>

            {/* Paste a link */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setUrlImportOpen(!urlImportOpen)}
                className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream/70 transition-colors w-full"
              >
                <span className="text-xs text-cream/30">{urlImportOpen ? '\u25BC' : '\u25B6'}</span>
                Paste a link instead
                <span className="text-[10px] text-cream/25 ml-auto">Works on mobile</span>
              </button>

              {urlImportOpen && (
                <div className="mt-3 bg-basalt-50 rounded-xl p-4 border border-cream/10">
                  <ImportFromUrlPanel
                    mode="create-idea"
                    onImport={handleUrlImport}
                    onCancel={() => setUrlImportOpen(false)}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Bookmarklet data present: image picker + destination + save ── */}
        {bookmarkletData && (
          <div className="space-y-5">
            <p className="text-cream/60 text-sm mb-2">
              Images captured from <span className="text-cream/80">{sourceHost}</span>
            </p>

            {/* Source info */}
            <div className="bg-basalt-50 rounded-lg p-3 border border-cream/10">
              <p className="text-[11px] text-cream/40 uppercase tracking-wide mb-1">
                Captured from bookmarklet
              </p>
              {bookmarkletData.title && (
                <p className="text-sm text-cream font-medium leading-snug">
                  {bookmarkletData.title}
                </p>
              )}
              <a
                href={bookmarkletData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sandstone/70 hover:text-sandstone truncate block mt-1"
              >
                {bookmarkletData.url}
              </a>
            </div>

            {/* Image picker grid */}
            {bookmarkletData.images.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-cream/50">
                    Select images (optional) · {selectedUrls.size} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUrls(new Set(bookmarkletData.images.map((i) => i.url)))}
                      className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUrls(new Set())}
                      className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                  {bookmarkletData.images.map((img) => {
                    const isSelected = selectedUrls.has(img.url)
                    return (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => toggleImage(img.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-sandstone ring-1 ring-sandstone/30'
                            : 'border-transparent hover:border-cream/20'
                        }`}
                      >
                        <ImageWithFallback
                          src={proxyUrl(img.url)}
                          alt={img.label || ''}
                          className="w-full h-full object-cover"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center bg-basalt-50">
                              <span className="text-2xl opacity-30">{'\uD83D\uDDBC\uFE0F'}</span>
                            </div>
                          }
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-sandstone rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-basalt">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                        {img.label && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5">
                            <p className="text-[10px] text-white truncate">{img.label}</p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-basalt-50 rounded-lg p-4 text-center">
                <p className="text-xs text-cream/50 mb-1">No images found on this page.</p>
                <p className="text-[11px] text-cream/30">You can still save this URL as an idea.</p>
              </div>
            )}

            {/* Name & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-cream/50 mb-1">Idea name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this idea..."
                  className="w-full px-3 py-2 bg-basalt-50 border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/50 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Price, specs, or other details..."
                  rows={2}
                  className="w-full px-3 py-2 bg-basalt-50 border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone resize-none"
                />
              </div>
            </div>

            {/* ══ Destination Picker ══ */}
            <div>
              <label className="block text-xs text-cream/50 mb-2">Save to</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDestination('mood_boards')
                    setSelectedRoomId(null)
                    setSelectedDecisionId(null)
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    destination === 'mood_boards'
                      ? 'border-sandstone bg-sandstone/10'
                      : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                  }`}
                >
                  <p className={`text-sm font-medium ${destination === 'mood_boards' ? 'text-sandstone' : 'text-cream'}`}>
                    Mood Boards
                  </p>
                  <p className="text-[11px] text-cream/40 mt-0.5">
                    Save for inspiration
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestination('finish_decisions')
                    setSelectedBoardId(null)
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    destination === 'finish_decisions'
                      ? 'border-sandstone bg-sandstone/10'
                      : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                  }`}
                >
                  <p className={`text-sm font-medium ${destination === 'finish_decisions' ? 'text-sandstone' : 'text-cream'}`}>
                    Finish Selections
                  </p>
                  <p className="text-[11px] text-cream/40 mt-0.5">
                    Add to a room selection
                  </p>
                </button>
              </div>
            </div>

            {/* ── Mood Boards: Board picker ── */}
            {destination === 'mood_boards' && (
              <div>
                <label className="block text-xs text-cream/50 mb-2">
                  Board <span className="text-cream/30">(optional — defaults to Saved Ideas)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mbBoards.map((board) => {
                    const isActive = selectedBoardId === board.id
                    return (
                      <button
                        key={board.id}
                        type="button"
                        onClick={() => setSelectedBoardId(isActive ? null : board.id)}
                        className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                          isActive
                            ? 'border-sandstone bg-sandstone/10'
                            : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                        }`}
                      >
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-sandstone' : 'text-cream'}`}>
                          {board.name}
                        </p>
                        <p className="text-[10px] text-cream/30">
                          {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
                        </p>
                      </button>
                    )
                  })}

                  {/* New Board */}
                  {isCreatingBoard ? (
                    <div className="px-3 py-2.5 rounded-lg border-2 border-sandstone/30 bg-basalt-50">
                      <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateBoard()
                          if (e.key === 'Escape') {
                            setIsCreatingBoard(false)
                            setNewBoardName('')
                          }
                        }}
                        placeholder="Board name..."
                        autoFocus
                        className="w-full px-2 py-1 bg-basalt border border-cream/20 text-cream text-sm rounded focus:outline-none focus:border-sandstone mb-1"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleCreateBoard}
                          disabled={!newBoardName.trim()}
                          className="flex-1 text-[11px] px-2 py-1 bg-sandstone text-basalt rounded font-medium disabled:opacity-30"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsCreatingBoard(false); setNewBoardName('') }}
                          className="text-[11px] px-2 py-1 text-cream/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreatingBoard(true)}
                      className="px-3 py-2.5 rounded-lg border-2 border-dashed border-cream/15 hover:border-sandstone/30 text-left transition-colors"
                    >
                      <p className="text-sm text-cream/50">+ New Board</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Finish Selections: Room + Selection picker ── */}
            {destination === 'finish_decisions' && (
              <>
                {fdRooms.filter((r) => !isGlobalUnsorted(r)).length === 0 ? (
                  <div className="bg-basalt-50 rounded-lg p-4 text-center">
                    <p className="text-cream/50 text-sm mb-1">
                      No rooms yet? No problem.
                    </p>
                    <p className="text-[11px] text-cream/30">
                      This idea will go to your Unsorted bucket. You can move it to a room later.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Room tiles */}
                    <div>
                      <label className="block text-xs text-cream/50 mb-2">
                        Room <span className="text-cream/30">(optional — skipping saves to Unsorted)</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {fdRooms.filter((r) => !isGlobalUnsorted(r)).map((room) => {
                          const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '\u270F\uFE0F'
                          const isActive = selectedRoomId === room.id
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => {
                                setSelectedRoomId(room.id)
                                setSelectedDecisionId(null)
                              }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                                isActive
                                  ? 'border-sandstone bg-sandstone/10'
                                  : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                              }`}
                            >
                              <span className="text-base">{emoji}</span>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-sandstone' : 'text-cream'}`}>
                                  {room.name}
                                </p>
                                <p className="text-[10px] text-cream/30">
                                  {room.decisions.filter((d) => d.systemKey !== 'uncategorized').length} selections
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selection tiles */}
                    {selectedRoom && selectedRoom.decisions.filter((d) => d.systemKey !== 'uncategorized').length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs text-cream/50">
                            Selection <span className="text-cream/30">(optional)</span>
                          </label>
                          {selectedDecisionId && (
                            <button
                              type="button"
                              onClick={() => setSelectedDecisionId(null)}
                              className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedRoom.decisions
                            .filter((d) => d.systemKey !== 'uncategorized')
                            .map((decision) => {
                              const isActive = selectedDecisionId === decision.id
                              return (
                                <button
                                  key={decision.id}
                                  type="button"
                                  onClick={() => setSelectedDecisionId(isActive ? null : decision.id)}
                                  className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${
                                    isActive
                                      ? 'border-sandstone bg-sandstone/10'
                                      : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                                  }`}
                                >
                                  <p className={`text-sm font-medium truncate ${isActive ? 'text-sandstone' : 'text-cream'}`}>
                                    {decision.title}
                                  </p>
                                  <p className="text-[10px] text-cream/30">
                                    {decision.options.length} ideas
                                  </p>
                                </button>
                              )
                            })}
                        </div>
                        {!selectedDecisionId && (
                          <p className="text-[11px] text-cream/30 mt-1.5">
                            No selection? Idea will go to Unsorted in this room. You can sort it later.
                          </p>
                        )}
                      </div>
                    )}

                    {selectedRoom && selectedRoom.decisions.filter((d) => d.systemKey !== 'uncategorized').length === 0 && (
                      <p className="text-[11px] text-cream/30">
                        This room has no selections yet. Idea will go to Uncategorized.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBookmarkletData(null)
                  setSelectedUrls(new Set())
                  setName('')
                  setNotes('')
                  setSelectedDecisionId(null)
                  setDestination(fromParam === 'mood-boards' ? 'mood_boards' : null)
                }}
                className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="savefromweb-save"
                onClick={handleSave}
                disabled={!canSave}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save Idea
              </button>
            </div>
          </div>
        )}

        {/* Multi-project notice */}
        {projects.length > 1 && (
          <p className="text-[11px] text-cream/30 mt-6">
            Saving to: {currentProject.name}. Switch projects from the dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
