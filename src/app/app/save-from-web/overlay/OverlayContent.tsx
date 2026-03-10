'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { useCollectionState } from '@/hooks/useCollectionState'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionsPayloadV4, SelectionV4 } from '@/data/finish-decisions'
import type { MoodBoardPayload } from '@/data/mood-boards'
import { DEFAULT_PAYLOAD as DEFAULT_MB_PAYLOAD, ensureDefaultBoard, findDefaultBoard, genId } from '@/data/mood-boards'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import type { CapturedContent } from '@/lib/capture/decodeBookmarklet'
import { capturedToMoodBoardIdea, capturedToSelectionOption } from '@/lib/capture/normalizeCapturedContent'

const DEFAULT_FD_PAYLOAD: FinishDecisionsPayloadV4 = { version: 4, selections: [] }

type Destination = 'mood_boards' | 'finish_decisions'
type SelectField = 'price' | 'specs' | 'name'

export function OverlayContent() {
  const { currentProject, isLoading: projectsLoading } = useProject()
  const projectId = currentProject?.id || null

  // Workspace resolution for Selections
  const [workspaceCollectionId, setWorkspaceCollectionId] = useState<string | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setWorkspaceLoading(false); return }
    let cancelled = false
    setWorkspaceLoading(true)
    setWorkspaceCollectionId(null)
    async function resolve() {
      try {
        const res = await fetch(`/api/selections-workspace/resolve?projectId=${projectId}`)
        if (cancelled) return
        if (res.ok) {
          const info = await res.json()
          setWorkspaceCollectionId(info.workspaceCollectionId)
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setWorkspaceLoading(false) }
    }
    resolve()
    return () => { cancelled = true }
  }, [projectId])

  const { state: fdState, setState: setFdState, isLoaded: fdLoaded } =
    useCollectionState<FinishDecisionsPayloadV4>({
      collectionId: workspaceCollectionId,
      toolKey: 'finish_decisions',
      localStorageKey: 'hhc_finish_decisions_v2',
      defaultValue: DEFAULT_FD_PAYLOAD,
    })

  const { state: mbState, setState: setMbState, isLoaded: mbLoaded } =
    useToolState<MoodBoardPayload>({
      toolKey: 'mood_boards',
      localStorageKey: 'hhc_mood_boards_v1',
      defaultValue: DEFAULT_MB_PAYLOAD,
      projectIdOverride: projectId,
    })

  const isLoaded = fdLoaded && mbLoaded && !workspaceLoading && !projectsLoading

  // Captured content from parent page via postMessage
  const [capturedContent, setCapturedContent] = useState<CapturedContent | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [specs, setSpecs] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [destination, setDestination] = useState<Destination>('finish_decisions')
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [selectingField, setSelectingField] = useState<SelectField | null>(null)

  // Listen for messages from parent page
  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== 'object') return

      if (ev.data.type === 'hhc:captured') {
        const payload = ev.data.payload as CapturedContent
        setCapturedContent(payload)
        setName(payload.productName || payload.title || '')
        if (payload.price) setPrice(payload.price)
        if (payload.specs) setSpecs(payload.specs)
        // Auto-select first image
        if (payload.images?.length > 0) {
          setSelectedUrls(new Set(payload.images.slice(0, 5).map((img: { url: string }) => img.url)))
        }
      }

      if (ev.data.type === 'hhc:selected') {
        const { field, value } = ev.data as { field: SelectField; value: string }
        if (field === 'price') setPrice(value)
        if (field === 'specs') setSpecs((prev) => prev ? `${prev}\n${value}` : value)
        if (field === 'name') setName(value)
        setSelectingField(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const startSelect = useCallback((field: SelectField) => {
    setSelectingField(field)
    window.parent.postMessage({ type: 'hhc:startSelect', field }, '*')
  }, [])

  const cancelSelect = useCallback(() => {
    setSelectingField(null)
    window.parent.postMessage({ type: 'hhc:cancelSelect' }, '*')
  }, [])

  const closeOverlay = useCallback(() => {
    window.parent.postMessage({ type: 'hhc:close' }, '*')
  }, [])

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

  const fdSelections = (fdState as FinishDecisionsPayloadV4).selections || []
  const mbBoards = ensureDefaultBoard((mbState as MoodBoardPayload).boards || [])

  const handleSave = () => {
    if (!capturedContent || !name.trim()) return

    if (destination === 'mood_boards') {
      const newIdea = capturedToMoodBoardIdea(capturedContent, selectedUrls, { name, notes })
      let targetBoardId = selectedBoardId
      const currentBoards = ensureDefaultBoard((mbState as MoodBoardPayload).boards || [])
      if (targetBoardId && !currentBoards.find((b) => b.id === targetBoardId)) targetBoardId = null
      if (!targetBoardId) {
        const defaultBoard = findDefaultBoard(currentBoards)
        targetBoardId = defaultBoard?.id || 'board_saved_ideas'
      }
      setMbState((prev) => {
        const p = prev as MoodBoardPayload
        let boards = ensureDefaultBoard(Array.isArray(p.boards) ? p.boards : [])
        boards = boards.map((b) =>
          b.id !== targetBoardId ? b : { ...b, ideas: [...b.ideas, newIdea], updatedAt: new Date().toISOString() }
        )
        return { ...p, boards }
      })
      setSavedName(currentBoards.find((b) => b.id === targetBoardId)?.name || 'Board')
    } else {
      const newOption = capturedToSelectionOption(capturedContent, selectedUrls, { name, notes, price, specs })
      const currentSelections = (fdState as FinishDecisionsPayloadV4).selections || []

      if (selectedSelectionId && currentSelections.find((s) => s.id === selectedSelectionId)) {
        const target = currentSelections.find((s) => s.id === selectedSelectionId)
        setSavedName(target?.title || 'Selection')
        setFdState((prev) => {
          const payload = prev as FinishDecisionsPayloadV4
          const selections = payload.selections || []
          return {
            ...payload,
            selections: selections.map((s) =>
              s.id === selectedSelectionId
                ? { ...s, options: [...(s.options || []), newOption], updatedAt: new Date().toISOString() }
                : s
            ),
          }
        })
      } else {
        const ts = new Date().toISOString()
        const newSelId = genId('sel')
        const selName = name.trim() || 'New Selection'
        setSavedName(selName)
        const newSelection: SelectionV4 = {
          id: newSelId,
          title: selName,
          status: 'deciding',
          notes: '',
          options: [newOption],
          tags: [],
          createdAt: ts,
          updatedAt: ts,
        }
        setFdState((prev) => {
          const payload = prev as FinishDecisionsPayloadV4
          return { ...payload, selections: [...(payload.selections || []), newSelection] }
        })
      }
    }

    setSaved(true)
  }

  // ── Render ──

  // Full-viewport overlay to cover AppShell in iframe
  return (
    <div className="fixed inset-0 z-[9999] bg-basalt overflow-y-auto">
      <div className="p-4 min-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-lg text-sandstone">Save to HHC</h1>
          <button
            type="button"
            onClick={closeOverlay}
            className="text-cream/40 hover:text-cream/70 transition-colors text-sm"
          >
            Close
          </button>
        </div>

        {/* Loading */}
        {(!capturedContent || !isLoaded) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-cream/40">
                {!capturedContent ? 'Waiting for page data...' : 'Loading...'}
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-3">&#10003;</div>
              <p className="text-sm text-cream font-medium mb-1">Saved!</p>
              <p className="text-xs text-cream/50 mb-4">Added to {savedName}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaved(false)
                    setCapturedContent(null)
                    setSelectedUrls(new Set())
                    setName(''); setNotes(''); setPrice(''); setSpecs('')
                  }}
                  className="px-4 py-2 text-xs text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                >
                  Save another
                </button>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="px-4 py-2 text-xs text-cream/40 hover:text-cream/60 transition-colors"
                >
                  Close panel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main form */}
        {capturedContent && isLoaded && !saved && (
          <div className="flex-1 space-y-4">
            {/* Source info */}
            <div className="bg-cream/5 rounded-lg p-2.5">
              {capturedContent.productName && (
                <p className="text-xs text-cream font-medium leading-snug truncate">
                  {capturedContent.productName}
                </p>
              )}
              {(capturedContent.brand || capturedContent.price) && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {capturedContent.brand && <span className="text-[11px] text-cream/50">{capturedContent.brand}</span>}
                  {capturedContent.price && <span className="text-[11px] text-sandstone font-medium">{capturedContent.price}</span>}
                </div>
              )}
              <p className="text-[10px] text-cream/30 truncate mt-0.5">{capturedContent.url}</p>
            </div>

            {/* Image thumbnails */}
            {capturedContent.images.length > 0 && (
              <div>
                <p className="text-[10px] text-cream/40 mb-1.5">{selectedUrls.size} image{selectedUrls.size !== 1 ? 's' : ''} selected</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {capturedContent.images.slice(0, 10).map((img) => {
                    const isSelected = selectedUrls.has(img.url)
                    return (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => toggleImage(img.url)}
                        className={`relative w-14 h-14 shrink-0 rounded overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-sandstone' : 'border-transparent opacity-50'
                        }`}
                      >
                        <ImageWithFallback
                          src={proxyUrl(img.url)}
                          alt={img.label || ''}
                          className="w-full h-full object-cover"
                          fallback={<div className="w-full h-full bg-cream/10" />}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Fields */}
            <div className="space-y-3">
              {/* Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-cream/40 uppercase tracking-wide">Name</label>
                  <button
                    type="button"
                    onClick={() => selectingField === 'name' ? cancelSelect() : startSelect('name')}
                    className={`text-[10px] transition-colors ${
                      selectingField === 'name' ? 'text-amber-400 animate-pulse' : 'text-sandstone/60 hover:text-sandstone'
                    }`}
                  >
                    {selectingField === 'name' ? 'Click on page...' : 'Select from page'}
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this idea..."
                  className="w-full px-2.5 py-1.5 bg-cream/5 border border-cream/15 text-cream text-sm rounded placeholder:text-cream/25 focus:outline-none focus:border-sandstone"
                />
              </div>

              {/* Price */}
              {destination === 'finish_decisions' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-cream/40 uppercase tracking-wide">Price</label>
                    <button
                      type="button"
                      onClick={() => selectingField === 'price' ? cancelSelect() : startSelect('price')}
                      className={`text-[10px] transition-colors ${
                        selectingField === 'price' ? 'text-amber-400 animate-pulse' : 'text-sandstone/60 hover:text-sandstone'
                      }`}
                    >
                      {selectingField === 'price' ? 'Click on page...' : 'Select from page'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $1,200"
                    className="w-full px-2.5 py-1.5 bg-cream/5 border border-cream/15 text-cream text-sm rounded placeholder:text-cream/25 focus:outline-none focus:border-sandstone"
                  />
                </div>
              )}

              {/* Specs */}
              {destination === 'finish_decisions' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-cream/40 uppercase tracking-wide">Specs</label>
                    <button
                      type="button"
                      onClick={() => selectingField === 'specs' ? cancelSelect() : startSelect('specs')}
                      className={`text-[10px] transition-colors ${
                        selectingField === 'specs' ? 'text-amber-400 animate-pulse' : 'text-sandstone/60 hover:text-sandstone'
                      }`}
                    >
                      {selectingField === 'specs' ? 'Click on page...' : 'Select from page'}
                    </button>
                  </div>
                  <textarea
                    value={specs}
                    onChange={(e) => setSpecs(e.target.value)}
                    placeholder="Dimensions, materials..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 bg-cream/5 border border-cream/15 text-cream text-sm rounded placeholder:text-cream/25 focus:outline-none focus:border-sandstone resize-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[10px] text-cream/40 uppercase tracking-wide block mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why you like this..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 bg-cream/5 border border-cream/15 text-cream text-sm rounded placeholder:text-cream/25 focus:outline-none focus:border-sandstone resize-none"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="text-[10px] text-cream/40 uppercase tracking-wide block mb-1.5">Save to</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDestination('finish_decisions')}
                  className={`px-2.5 py-2 rounded border text-left transition-all ${
                    destination === 'finish_decisions'
                      ? 'border-sandstone bg-sandstone/10'
                      : 'border-cream/10 bg-cream/5'
                  }`}
                >
                  <p className={`text-xs font-medium ${destination === 'finish_decisions' ? 'text-sandstone' : 'text-cream/70'}`}>
                    Selections
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setDestination('mood_boards')}
                  className={`px-2.5 py-2 rounded border text-left transition-all ${
                    destination === 'mood_boards'
                      ? 'border-sandstone bg-sandstone/10'
                      : 'border-cream/10 bg-cream/5'
                  }`}
                >
                  <p className={`text-xs font-medium ${destination === 'mood_boards' ? 'text-sandstone' : 'text-cream/70'}`}>
                    Mood Board
                  </p>
                </button>
              </div>
            </div>

            {/* Selection/Board picker */}
            {destination === 'finish_decisions' && fdSelections.length > 0 && (
              <div>
                <label className="text-[10px] text-cream/40 uppercase tracking-wide block mb-1.5">Selection</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {fdSelections.map((sel) => (
                    <button
                      key={sel.id}
                      type="button"
                      onClick={() => setSelectedSelectionId(selectedSelectionId === sel.id ? null : sel.id)}
                      className={`w-full px-2.5 py-1.5 rounded text-left text-xs transition-all ${
                        selectedSelectionId === sel.id
                          ? 'bg-sandstone/15 text-sandstone border border-sandstone/30'
                          : 'bg-cream/5 text-cream/70 border border-transparent hover:border-cream/15'
                      }`}
                    >
                      <span className="truncate block">{sel.title}</span>
                      <span className="text-[10px] text-cream/30">{sel.options?.length || 0} options</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-cream/30 mt-1">
                  Or leave empty to create a new selection
                </p>
              </div>
            )}

            {destination === 'mood_boards' && mbBoards.length > 0 && (
              <div>
                <label className="text-[10px] text-cream/40 uppercase tracking-wide block mb-1.5">Board</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {mbBoards.map((board) => (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => setSelectedBoardId(selectedBoardId === board.id ? null : board.id)}
                      className={`w-full px-2.5 py-1.5 rounded text-left text-xs transition-all ${
                        selectedBoardId === board.id
                          ? 'bg-sandstone/15 text-sandstone border border-sandstone/30'
                          : 'bg-cream/5 text-cream/70 border border-transparent hover:border-cream/15'
                      }`}
                    >
                      <span className="truncate block">{board.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
