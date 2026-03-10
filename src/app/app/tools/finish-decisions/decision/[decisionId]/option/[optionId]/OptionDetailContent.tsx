'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import { useToolState } from '@/hooks/useToolState'
import { useComments } from '@/hooks/useComments'
import { useProject } from '@/contexts/ProjectContext'
import { useSelectionLastVisited } from '@/hooks/useSelectionLastVisited'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { CollapsibleCommentSidebar, CommentTriggerButton, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import { MoveIdeaSheet } from '../../../../components/MoveIdeaSheet'
import { ExpandableSpecs } from '../../../../components/ExpandableSpecs'
import { uploadIdeaFile } from '../../../../components/IdeasBoard'
import { uploadDocument } from '../../../../uploadDocument'
import { buildOptionHref } from '../../../../lib/routing'
import { formatDate, linkHostname, fetchLinkPreview, displayPrice, formatFileSize, docTypeColor, docTypeLabel, isValidUrl } from '../../../../lib/optionUtils'
import { getAllImages, getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { moveIdea } from '@/lib/decisionHelpers'
import {
  STATUS_CONFIG_V3,
  resolveSelectionAccess,
  type OptionV3,
  type OptionImageV3,
  type OptionDocumentV3,
  type StatusV3,
  type LinkV3,
  type SelectionV4,
  type FinishDecisionsPayloadV4,
} from '@/data/finish-decisions'

export function OptionDetailContent({
  collectionId,
}: {
  collectionId?: string
}) {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const decisionId = params.decisionId as string
  const optionId = params.optionId as string

  // ── State ──
  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const [moveMode, setMoveMode] = useState<'move' | 'copy'>('move')
  const [assignToast, setAssignToast] = useState<string | null>(null)

  // Inline editing state
  const [newUrl, setNewUrl] = useState('')
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editingUrlValue, setEditingUrlValue] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docUploadError, setDocUploadError] = useState('')
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingDocTitle, setEditingDocTitle] = useState('')
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoMenuRef = useRef<HTMLDivElement>(null)

  // ── Data loading (shared localStorage cache) ──
  const collResult = useCollectionState<FinishDecisionsPayloadV4 | any>({
    collectionId: collectionId ?? null,
    toolKey: 'finish_decisions',
    localStorageKey: `hhc_finish_decisions_coll_${collectionId}`,
    defaultValue: { version: 4, selections: [] },
  })
  const toolResult = useToolState<FinishDecisionsPayloadV4 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 4, selections: [] },
  })
  const useCollectionMode = !!collectionId
  const result = useCollectionMode ? collResult : toolResult
  const { state, setState, isLoaded } = result
  const readOnly = useCollectionMode ? collResult.readOnly : toolResult.readOnly
  const workspaceAccess = useCollectionMode ? (collResult.access || null) : null

  const v4State =
    state.version === 4
      ? (state as FinishDecisionsPayloadV4)
      : { version: 4 as const, selections: [] as SelectionV4[] }

  const foundDecision = v4State.selections.find((s) => s.id === decisionId)
  const foundOption = foundDecision?.options.find((o) => o.id === optionId)

  // Access check
  const selectionAccess = foundDecision && session?.user?.email
    ? resolveSelectionAccess(foundDecision, session.user.email, workspaceAccess || 'VIEWER')
    : (foundDecision ? 'edit' : null)
  const selectionBlocked = foundDecision && selectionAccess === null

  // Redirect when not found or blocked
  const shouldRedirect = isLoaded && (!foundDecision || selectionBlocked || !foundOption)
  useEffect(() => {
    if (shouldRedirect && foundDecision && !foundOption) {
      // Option not found — go back to selection page
      router.replace(`/app/tools/finish-decisions/decision/${decisionId}`)
    } else if (shouldRedirect) {
      router.replace('/app/tools/finish-decisions')
    }
  }, [shouldRedirect, router, decisionId, foundDecision, foundOption])

  // Comments
  const decisionComments = useComments({
    collectionId: collectionId ?? null,
    targetType: 'decision',
    targetId: decisionId,
  })

  // Mark visited for unread badges
  const { markVisited } = useSelectionLastVisited(collectionId)
  useEffect(() => {
    if (foundDecision && collectionId) {
      markVisited(decisionId)
    }
  }, [foundDecision, collectionId, decisionId, markVisited])

  // Filter comments for this option
  const optionComments = useMemo(() =>
    decisionComments.comments.filter((c) => c.refEntityId === optionId),
    [decisionComments.comments, optionId]
  )

  // Carousel
  const currentIndex = foundDecision?.options.findIndex((o) => o.id === optionId) ?? -1
  const hasPrev = currentIndex > 0
  const hasNext = foundDecision ? currentIndex < foundDecision.options.length - 1 : false
  const totalOptions = foundDecision?.options.length ?? 0
  const prevOptionId = hasPrev ? foundDecision!.options[currentIndex - 1].id : null
  const nextOptionId = hasNext ? foundDecision!.options[currentIndex + 1].id : null

  // Keyboard navigation
  useEffect(() => {
    if (totalOptions <= 1) return
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft' && prevOptionId) {
        e.preventDefault()
        router.push(buildOptionHref({ decisionId, optionId: prevOptionId }))
      } else if (e.key === 'ArrowRight' && nextOptionId) {
        e.preventDefault()
        router.push(buildOptionHref({ decisionId, optionId: nextOptionId }))
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [totalOptions, prevOptionId, nextOptionId, decisionId, router])

  // Photo menu click-outside
  useEffect(() => {
    if (!showPhotoMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPhotoMenu])

  // ── Mutations ──
  const updateDecision = useCallback((updates: Partial<SelectionV4>, events?: ActivityEventHint[]) => {
    setState((prev) => ({
      ...prev,
      selections: (prev as FinishDecisionsPayloadV4).selections.map((s) =>
        s.id === decisionId
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }), events)
  }, [setState, decisionId])

  const updateOption = useCallback((updates: Partial<OptionV3>) => {
    if (!foundDecision) return
    updateDecision({
      options: foundDecision.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, ...updates, updatedAt: new Date().toISOString() }
          : opt
      ),
    })
  }, [foundDecision, optionId, updateDecision])

  const deleteOption = useCallback(() => {
    if (!foundDecision) return
    if (confirm('Delete this option?')) {
      updateDecision({
        options: foundDecision.options.filter((opt) => opt.id !== optionId),
      })
      router.push(`/app/tools/finish-decisions/decision/${decisionId}`)
    }
  }, [foundDecision, optionId, updateDecision, router, decisionId])

  const selectOption = useCallback(() => {
    if (!foundDecision) return
    const alreadySelected = foundOption?.isSelected
    const isToggleOff = !!alreadySelected
    const userName = session?.user?.name || 'Unknown'
    const now = new Date().toISOString()

    const updates: Partial<SelectionV4> = {
      options: foundDecision.options.map((opt) => ({
        ...opt,
        isSelected: isToggleOff ? false : opt.id === optionId,
        updatedAt: now,
      })),
      finalSelection: isToggleOff
        ? null
        : { optionId, selectedBy: userName, selectedAt: now },
    }

    const st = foundDecision.status
    if (st !== 'ordered' && st !== 'done') {
      updates.status = isToggleOff ? 'deciding' : 'selected'
      updates.statusLog = [
        ...(foundDecision.statusLog || []),
        { status: (isToggleOff ? 'deciding' : 'selected') as StatusV3, markedBy: userName, markedAt: now },
      ]
    }

    const events: ActivityEventHint[] = isToggleOff ? [] : [{
      action: 'selected',
      entityType: 'decision',
      entityId: decisionId,
      summaryText: `Selected option for: "${foundDecision.title}"`,
      entityLabel: foundDecision.title,
    }]
    updateDecision(updates, events.length > 0 ? events : undefined)
  }, [foundDecision, foundOption, optionId, session, decisionId, updateDecision])

  // Move/copy handlers
  function moveOptionToSelection(
    targetSelectionId: string | null,
    newSelectionTitle?: string,
  ) {
    if (!foundDecision || !foundOption) return
    const targetName = newSelectionTitle
      || v4State.selections.find((s) => s.id === targetSelectionId)?.title
      || 'New Selection'

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV4
      const updated = moveIdea(
        payload.selections,
        foundDecision!.id,
        optionId,
        targetSelectionId,
        newSelectionTitle,
      )
      return { ...payload, selections: updated }
    }, [
      {
        action: 'moved_out',
        entityType: 'option',
        entityId: optionId,
        summaryText: `Moved "${foundOption.name || 'option'}" out of "${foundDecision!.title}"`,
        entityLabel: foundOption.name || 'option',
        detailText: `from ${foundDecision!.title}`,
      },
      {
        action: 'moved_in',
        entityType: 'option',
        entityId: optionId,
        summaryText: `Moved "${foundOption.name || 'option'}" into "${targetName}"`,
        entityLabel: foundOption.name || 'option',
        detailText: `to ${targetName}`,
      },
    ])

    setAssignToast(`Moved to ${targetName}`)
    setMoveSheetOpen(false)
    setTimeout(() => setAssignToast(null), 3000)
    router.push(`/app/tools/finish-decisions/decision/${decisionId}`)
  }

  function copyOptionToSelection(
    targetSelectionId: string | null,
    newSelectionTitle?: string,
  ) {
    if (!foundDecision || !foundOption) return
    const now = new Date().toISOString()
    const clone: OptionV3 = {
      ...foundOption,
      id: crypto.randomUUID(),
      isSelected: false,
      votes: undefined,
      createdAt: now,
      updatedAt: now,
    }

    const targetName = newSelectionTitle
      || v4State.selections.find((s) => s.id === targetSelectionId)?.title
      || 'New Selection'

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV4
      let resolvedTargetId = targetSelectionId
      let selections = [...payload.selections]

      if (newSelectionTitle && !resolvedTargetId) {
        const newSelection: SelectionV4 = {
          id: crypto.randomUUID(),
          title: newSelectionTitle,
          status: 'deciding' as StatusV3,
          notes: '',
          options: [],
          tags: foundDecision?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        }
        selections = [...selections, newSelection]
        resolvedTargetId = newSelection.id
      }

      if (!resolvedTargetId) return prev

      return {
        ...payload,
        selections: selections.map((s) =>
          s.id === resolvedTargetId
            ? { ...s, options: [...s.options, clone], updatedAt: now }
            : s
        ),
      }
    }, [{
      action: 'copied',
      entityType: 'option',
      entityId: optionId,
      summaryText: `Copied "${foundOption.name || 'option'}" to "${targetName}"`,
      entityLabel: foundOption.name || 'option',
      detailText: `to ${targetName}`,
    }])

    setAssignToast(`Copied to ${targetName}`)
    setMoveSheetOpen(false)
    setTimeout(() => setAssignToast(null), 3000)
  }

  // ── Inline handlers (photos, urls, docs, comments) ──
  const MAX_IMAGES = 5

  async function handlePhotoFile(file: File | null) {
    if (!file || !foundOption) return
    if (file.size === 0) { setUploadError('Empty file — please try again.'); return }
    const currentCount = getAllImages(foundOption).filter((i) => i.id !== 'legacy').length
    if (currentCount >= MAX_IMAGES) { setUploadError(`Maximum ${MAX_IMAGES} images per option.`); return }
    setUploadError('')
    setUploading(true)
    try {
      const { url, thumbnailUrl } = await uploadIdeaFile(file)
      const newImg: OptionImageV3 = { id: crypto.randomUUID(), url, thumbnailUrl }
      const current = getAllImages(foundOption).filter((i) => i.id !== 'legacy')
      const merged = [...current, newImg]
      updateOption({
        kind: 'image',
        imageUrl: url,
        thumbnailUrl,
        images: merged,
        heroImageId: foundOption.heroImageId || newImg.id,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  function handlePhotoUrl() {
    if (!foundOption) return
    const url = photoUrlInput.trim()
    if (!url) return
    const current = getAllImages(foundOption).filter((i) => i.id !== 'legacy')
    if (current.length >= MAX_IMAGES) { setUploadError(`Maximum ${MAX_IMAGES} images per option.`); return }
    const newImg: OptionImageV3 = { id: crypto.randomUUID(), url, thumbnailUrl: url }
    const merged = [...current, newImg]
    updateOption({
      kind: 'image',
      imageUrl: url,
      thumbnailUrl: url,
      images: merged,
      heroImageId: foundOption.heroImageId || newImg.id,
    })
    setPhotoUrlInput('')
  }

  async function handleAddUrl() {
    const url = newUrl.trim()
    if (!url || !foundOption) return
    const newLink: LinkV3 = { id: crypto.randomUUID(), url }
    updateOption({ urls: [...foundOption.urls, newLink] })
    setNewUrl('')
    const meta = await fetchLinkPreview(url)
    if (meta.linkTitle || meta.linkDescription || meta.linkImage) {
      updateOption({ urls: [...foundOption.urls, { ...newLink, ...meta }] })
    }
  }

  function handleSaveEditUrl(urlId: string) {
    if (!foundOption) return
    const updated = editingUrlValue.trim()
    if (!updated) return
    updateOption({ urls: foundOption.urls.map((u) => u.id === urlId ? { ...u, url: updated } : u) })
    setEditingUrlId(null)
    setEditingUrlValue('')
    fetchLinkPreview(updated).then((meta) => {
      if (!foundOption) return
      if (meta.linkTitle || meta.linkDescription || meta.linkImage) {
        updateOption({ urls: foundOption.urls.map((u) => u.id === urlId ? { ...u, url: updated, ...meta } : u) })
      }
    })
  }

  function handleRemoveUrl(urlId: string) {
    if (!foundOption) return
    updateOption({ urls: foundOption.urls.filter((u) => u.id !== urlId) })
  }

  const MAX_DOCUMENTS = 10

  function isImageMime(file: File): boolean {
    if (file.type?.startsWith('image/')) return true
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    return !!ext && ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext)
  }

  async function handleDocumentFile(file: File | null) {
    if (!file || !foundOption) return
    if (file.size === 0) { setDocUploadError('Empty file — please try again.'); return }
    const currentDocs = foundOption.documents ?? []
    if (currentDocs.length >= MAX_DOCUMENTS) { setDocUploadError(`Maximum ${MAX_DOCUMENTS} files per option.`); return }
    setDocUploadError('')
    setDocUploading(true)
    try {
      if (isImageMime(file)) {
        const r = await uploadIdeaFile(file)
        const newDoc: OptionDocumentV3 = {
          id: r.id, url: r.url, thumbnailUrl: r.thumbnailUrl,
          title: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, fileSize: file.size,
          mimeType: file.type || 'image/jpeg', uploadedAt: new Date().toISOString(),
          uploadedByName: session?.user?.name || 'Unknown', uploadedByEmail: session?.user?.email || '',
        }
        updateOption({ documents: [...currentDocs, newDoc] })
      } else {
        const r = await uploadDocument(file)
        const newDoc: OptionDocumentV3 = {
          id: r.id, url: r.url,
          title: r.fileName.replace(/\.[^.]+$/, ''), fileName: r.fileName, fileSize: r.fileSize,
          mimeType: r.mimeType, uploadedAt: new Date().toISOString(),
          uploadedByName: session?.user?.name || 'Unknown', uploadedByEmail: session?.user?.email || '',
        }
        updateOption({ documents: [...currentDocs, newDoc] })
      }
    } catch (err) {
      setDocUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setDocUploading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  function handleRemoveDocument(docId: string) {
    if (!foundOption) return
    updateOption({ documents: (foundOption.documents ?? []).filter((d) => d.id !== docId) })
  }

  function handleSaveDocTitle(docId: string) {
    if (!foundOption) return
    const title = editingDocTitle.trim()
    if (!title) return
    updateOption({ documents: (foundOption.documents ?? []).map((d) => d.id === docId ? { ...d, title } : d) })
    setEditingDocId(null)
    setEditingDocTitle('')
  }

  // ── Loading / not found states ──
  if (!isLoaded) {
    return (
      <div className="pt-20 md:pt-20 pb-28 px-4 md:px-8 animate-pulse">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-4 w-32 bg-cream/10 rounded" />
          <div className="h-8 w-2/3 bg-cream/10 rounded" />
          <div className="h-64 bg-cream/10 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-cream/10 rounded" />
            <div className="h-4 w-3/4 bg-cream/10 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!foundDecision || !foundOption) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center py-12 text-cream/50">
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  const option = foundOption
  const decision = foundDecision
  const userEmail = session?.user?.email || ''
  const userName = session?.user?.name || 'Unknown'

  return (
    <div className="pt-20 md:pt-20 pb-24 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Sticky breadcrumb header ── */}
        <div className="sticky top-16 z-20 bg-basalt/95 backdrop-blur-sm -mx-4 md:-mx-8 px-4 md:px-8 py-3 border-b border-cream/8">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            {/* Left: back link + selection name */}
            <Link
              href={`/app/tools/finish-decisions/decision/${decisionId}`}
              className="flex items-center gap-2 text-cream/50 hover:text-cream transition-colors min-w-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm truncate">{decision.title || 'Untitled Selection'}</span>
            </Link>

            {/* Center: carousel */}
            {totalOptions > 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {prevOptionId ? (
                  <Link
                    href={buildOptionHref({ decisionId, optionId: prevOptionId })}
                    prefetch
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-cream/8 text-cream/50 hover:bg-cream/15 hover:text-cream transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cream/8 text-cream/20">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <span className="text-[11px] text-cream/30 tabular-nums min-w-[40px] text-center">
                  {currentIndex + 1} of {totalOptions}
                </span>
                {nextOptionId ? (
                  <Link
                    href={buildOptionHref({ decisionId, optionId: nextOptionId })}
                    prefetch
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-cream/8 text-cream/50 hover:bg-cream/15 hover:text-cream transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cream/8 text-cream/20">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
            )}

            {/* Right: mobile comment trigger + desktop comment trigger */}
            <div className="flex items-center gap-2 shrink-0">
              <CommentTriggerButton
                commentCount={optionComments.length}
                onClick={() => commentSidebarRef.current?.openMobileSheet()}
                className="md:hidden"
              />
              <CommentTriggerButton
                commentCount={optionComments.length}
                onClick={() => commentSidebarRef.current?.openMobileSheet()}
                className="hidden md:inline-flex"
              />
            </div>
          </div>
        </div>

        {/* ── Option title + actions bar ── */}
        <div className="mt-5 mb-4">
          {/* Origin badge */}
          {option.origin && (
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-cream/40">Part of {option.origin.kitLabel}</span>
            </div>
          )}

          {/* Name — read-only shows as wrapping text, edit mode uses input */}
          {readOnly ? (
            <h1 className="text-cream text-xl font-medium mb-3 break-words">{option.name || 'Untitled'}</h1>
          ) : (
            <input
              type="text"
              value={option.name}
              onChange={(e) => updateOption({ name: e.target.value })}
              placeholder="Option name..."
              className="w-full min-w-0 bg-transparent text-cream text-xl font-medium placeholder:text-cream/30 focus:outline-none mb-3"
            />
          )}

          {/* Action row: Voting + Final Decision | Move/Copy/Delete */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-cream/8">
            {/* LEFT GROUP: Voting + Final Decision */}
            {!readOnly ? (
              <div className="flex items-center gap-1">
                {(['love', 'up', 'down'] as const).map((type) => {
                  const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                  const votes = option.votes ?? {}
                  const myVote = votes[userEmail]
                  const isActive = myVote === type
                  const count = Object.values(votes).filter(v => v === type).length
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const next = { ...(option.votes ?? {}) }
                        if (next[userEmail] === type) delete next[userEmail]
                        else next[userEmail] = type
                        updateOption({ votes: next })
                      }}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        isActive
                          ? 'bg-sandstone/20 text-sandstone'
                          : 'bg-cream/8 text-cream/40 hover:bg-cream/15'
                      }`}
                    >
                      {emoji}{count > 0 ? ` ${count}` : ''}
                    </button>
                  )
                })}
              </div>
            ) : (() => {
              const votes = option.votes ?? {}
              const hasVotes = Object.keys(votes).length > 0
              if (!hasVotes) return null
              return (
                <div className="flex items-center gap-1">
                  {(['love', 'up', 'down'] as const).map((type) => {
                    const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                    const count = Object.values(votes).filter(v => v === type).length
                    if (count === 0) return null
                    return (
                      <span key={type} className="text-xs px-2 py-1 rounded-full bg-cream/5 text-cream/30">
                        {emoji} {count}
                      </span>
                    )
                  })}
                </div>
              )
            })()}

            {!readOnly ? (
              <button
                type="button"
                onClick={selectOption}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  option.isSelected
                    ? 'bg-sandstone text-basalt'
                    : 'bg-sandstone/15 text-sandstone hover:bg-sandstone/25'
                }`}
              >
                {option.isSelected ? 'Final Decision' : 'Mark as Final'}
              </button>
            ) : option.isSelected ? (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-sandstone text-basalt">
                Final Decision
              </span>
            ) : null}

            {/* RIGHT GROUP: Move/Copy (pushed right) */}
            {!readOnly && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => { setMoveMode('move'); setMoveSheetOpen(true) }}
                  className="px-2.5 py-1.5 rounded-full text-xs text-cream/40 hover:text-cream/60 hover:bg-cream/10 transition-colors"
                >
                  Move
                </button>
                {v4State.selections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { setMoveMode('copy'); setMoveSheetOpen(true) }}
                    className="px-2.5 py-1.5 rounded-full text-xs text-cream/40 hover:text-cream/60 hover:bg-cream/10 transition-colors"
                  >
                    Copy to...
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 2-column desktop layout / stacked mobile ── */}
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-5">

          {/* ── LEFT COLUMN: Image gallery only (compact, constrained) ── */}
          <div className="space-y-3">

            {/* Photos */}
            <div>
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)} />

              {(() => {
                const images = getAllImages(option)
                const hero = getHeroImage(option)
                const hasImages = images.length > 0

                return hasImages ? (
                  <div>
                    <div
                      className="relative rounded-xl overflow-hidden bg-basalt cursor-pointer"
                      onClick={() => !readOnly && !uploading && galleryInputRef.current?.click()}
                    >
                      <ImageWithFallback
                        src={displayUrl(hero?.url || images[0].url)}
                        alt={option.name || 'Option image'}
                        className="w-full max-h-64 object-contain"
                        fallback={<div className="w-full h-32 flex items-center justify-center bg-basalt"><span className="text-3xl opacity-20">🖼️</span></div>}
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                      {!readOnly && !uploading && (
                        <div className="absolute bottom-2 right-2" ref={photoMenuRef}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(!showPhotoMenu) }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-black/80 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            Change photo
                          </button>
                          {showPhotoMenu && (
                            <div className="absolute bottom-full right-0 mb-1.5 bg-basalt-50 border border-cream/15 rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                              <button type="button" onClick={() => { cameraInputRef.current?.click(); setShowPhotoMenu(false) }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                Take a photo
                              </button>
                              <div className="border-t border-cream/10" />
                              <button type="button" onClick={() => { galleryInputRef.current?.click(); setShowPhotoMenu(false) }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                                Photo library
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                        {images.map((img) => {
                          const isHero = img.id === (option.heroImageId || images[0].id)
                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => !readOnly && updateOption({ heroImageId: img.id })}
                              className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${isHero ? 'border-sandstone' : 'border-transparent hover:border-cream/20'}`}
                              title={isHero ? 'Primary image' : 'Set as primary'}
                            >
                              <ImageWithFallback src={displayUrl(img.thumbnailUrl || img.url)} alt={img.label || ''} className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center bg-cream/5"><span className="text-xs opacity-30">🖼️</span></div>} />
                              {isHero && (
                                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-sandstone rounded-full flex items-center justify-center">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-basalt"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : !readOnly ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full rounded-xl border border-dashed border-cream/15 bg-basalt/30 hover:border-cream/30 hover:bg-basalt/50 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-8">
                        {uploading ? (
                          <div className="w-8 h-8 border-2 border-cream/20 border-t-cream/60 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-7 h-7 text-cream/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        )}
                        <span className="text-xs text-cream/30">{uploading ? 'Uploading...' : 'Add a photo'}</span>
                      </div>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePhotoUrl() }}
                        placeholder="Or paste a photo URL..."
                        className="flex-1 bg-basalt border border-cream/15 rounded-lg px-2.5 py-1.5 text-xs text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
                      />
                      <button type="button" onClick={handlePhotoUrl} disabled={!photoUrlInput.trim() || !isValidUrl(photoUrlInput)} className="px-2.5 py-1.5 bg-cream/10 text-cream/60 text-xs rounded-lg hover:bg-cream/20 transition-colors disabled:opacity-30">
                        Use
                      </button>
                    </div>
                  </div>
                ) : null
              })()}

              {uploadError && <p className="text-sm text-red-400 mt-2">{uploadError}</p>}
            </div>

            {/* Timestamps (desktop, under image) */}
            <div className="hidden md:flex flex-col gap-1 text-[11px] text-cream/35 px-1">
              <span>Added {formatDate(option.createdAt)}</span>
              {option.updatedAt !== option.createdAt && (
                <span>Updated {formatDate(option.updatedAt)}</span>
              )}
            </div>

            {/* Desktop delete action (under image) */}
            {!readOnly && (
              <div className="hidden md:block pt-2">
                <button type="button" onClick={deleteOption} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">
                  Delete option
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Price, specs, links, files, comments ── */}
          <div className="space-y-4 mt-5 md:mt-0">

            {/* Final Decision badge */}
            {option.isSelected && (
              <div className="bg-sandstone/10 border border-sandstone/25 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-sandstone shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-semibold text-sandstone uppercase tracking-wider">Final Decision</span>
              </div>
            )}

            {/* Price */}
            {(!readOnly || option.price) && (
              <div>
                <label className="text-[11px] text-cream/40 uppercase tracking-wider mb-1 block">Price</label>
                {readOnly ? (
                  <p className="text-lg font-medium text-cream">{displayPrice(option.price)}</p>
                ) : (
                  <input
                    value={option.price || ''}
                    onChange={(e) => updateOption({ price: e.target.value })}
                    placeholder="e.g. $1,200"
                    className="w-full bg-basalt border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50"
                  />
                )}
              </div>
            )}

            {/* Specs / Notes */}
            {(!readOnly || option.notes) && (
              <ExpandableSpecs
                value={option.notes}
                readOnly={readOnly}
                onChange={(val) => updateOption({ notes: val })}
                optionName={option.name}
              />
            )}

            {/* Links */}
            <div>
              {option.urls.length > 0 && (
                <div className="space-y-2 mb-2">
                  {option.urls.map((u) => (
                    <div key={u.id}>
                      {editingUrlId === u.id ? (
                        <div className="flex gap-2">
                          <input autoFocus type="text" value={editingUrlValue} onChange={(e) => setEditingUrlValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditUrl(u.id); if (e.key === 'Escape') { setEditingUrlId(null); setEditingUrlValue('') } }}
                            className="flex-1 bg-basalt border border-sandstone/40 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none" />
                          <button type="button" onClick={() => handleSaveEditUrl(u.id)} className="px-3 py-2 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors">Save</button>
                          <button type="button" onClick={() => { setEditingUrlId(null); setEditingUrlValue('') }} className="px-2 py-2 text-cream/40 hover:text-cream/70 text-sm transition-colors">✕</button>
                        </div>
                      ) : (
                        <div className="bg-basalt rounded-xl overflow-hidden border border-cream/8">
                          {u.linkImage && (
                            <ImageWithFallback src={`/api/image-proxy?url=${encodeURIComponent(u.linkImage)}`} alt="" className="w-full h-24 object-cover" fallback={<div className="w-full h-24 bg-cream/5" />} />
                          )}
                          <div className="px-3 py-2 flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              {u.linkTitle ? (
                                <>
                                  <p className="text-sm font-medium text-cream/80 leading-snug line-clamp-1">{u.linkTitle}</p>
                                  {u.linkDescription && <p className="text-xs text-cream/40 line-clamp-1 mt-0.5">{u.linkDescription}</p>}
                                  <p className="text-[11px] text-cream/30 mt-0.5">{linkHostname(u.url)}</p>
                                </>
                              ) : (
                                <p className="text-sm text-cream/60 font-mono truncate">{u.url}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              <a href={u.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-cream/40 hover:text-sandstone transition-colors" title="Open link">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" /><path d="M15 3h6v6" strokeLinecap="round" /><path d="M10 14L21 3" strokeLinecap="round" /></svg>
                              </a>
                              {!readOnly && (
                                <>
                                  <button type="button" onClick={() => { setEditingUrlId(u.id); setEditingUrlValue(u.url) }} className="p-1.5 text-cream/40 hover:text-cream/70 transition-colors" title="Edit URL">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" /></svg>
                                  </button>
                                  <button type="button" onClick={() => handleRemoveUrl(u.id)} className="p-1.5 text-cream/30 hover:text-red-400 transition-colors" title="Remove">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!readOnly && (
                <div className="flex gap-2">
                  <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                    placeholder="https://..."
                    className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50" />
                  <button type="button" onClick={handleAddUrl} disabled={!newUrl.trim() || !isValidUrl(newUrl)} className="px-3 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors disabled:opacity-30">Add</button>
                </div>
              )}
              {newUrl && !isValidUrl(newUrl) && <p className="text-yellow-500 text-xs mt-1">URL should start with http:// or https://</p>}
            </div>

            {/* Files */}
            {(!readOnly || (option.documents && option.documents.length > 0)) && (
              <div>
                <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.heic,.heif" className="hidden" onChange={(e) => handleDocumentFile(e.target.files?.[0] ?? null)} />
                <label className="text-[11px] text-cream/30 uppercase tracking-wider mb-2 block">Files</label>

                {(option.documents ?? []).length > 0 && (
                  <div className="space-y-2 mb-2">
                    {(option.documents ?? []).map((doc) => (
                      <div key={doc.id} className="bg-basalt rounded-xl border border-cream/8 px-3 py-2.5">
                        {editingDocId === doc.id ? (
                          <div className="flex gap-2">
                            <input autoFocus type="text" value={editingDocTitle} onChange={(e) => setEditingDocTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDocTitle(doc.id); if (e.key === 'Escape') { setEditingDocId(null); setEditingDocTitle('') } }}
                              className="flex-1 bg-basalt border border-sandstone/40 rounded-lg px-3 py-1.5 text-sm text-cream focus:outline-none" />
                            <button type="button" onClick={() => handleSaveDocTitle(doc.id)} className="px-3 py-1.5 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors">Save</button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2.5">
                            <span className={`text-[10px] font-bold uppercase mt-0.5 shrink-0 ${docTypeColor(doc.mimeType)}`}>{docTypeLabel(doc.mimeType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-cream/80 leading-snug truncate">{doc.title}</p>
                              <p className="text-[11px] text-cream/30 mt-0.5">{formatFileSize(doc.fileSize)} · {doc.uploadedByName} · {formatDate(doc.uploadedAt)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={doc.url} download={doc.fileName} onClick={(e) => e.stopPropagation()} className="p-1.5 text-cream/40 hover:text-sandstone transition-colors" title="Download">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" /><polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" /></svg>
                              </a>
                              {!readOnly && (
                                <>
                                  <button type="button" onClick={() => { setEditingDocId(doc.id); setEditingDocTitle(doc.title) }} className="p-1.5 text-cream/40 hover:text-cream/70 transition-colors" title="Rename">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" /></svg>
                                  </button>
                                  <button type="button" onClick={() => handleRemoveDocument(doc.id)} className="p-1.5 text-cream/30 hover:text-red-400 transition-colors" title="Remove">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!readOnly && (
                  <button type="button" onClick={() => docInputRef.current?.click()} disabled={docUploading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-cream/5 hover:bg-cream/10 rounded-lg text-sm text-cream/40 hover:text-cream/60 transition-colors disabled:opacity-50">
                    {docUploading ? (
                      <><div className="w-4 h-4 border-2 border-cream/20 border-t-cream/60 rounded-full animate-spin" />Uploading...</>
                    ) : (
                      <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>Upload file</>
                    )}
                  </button>
                )}

                {docUploadError && <p className="text-sm text-red-400 mt-2">{docUploadError}</p>}
              </div>
            )}

            {/* Comment sidebar (desktop: inline full-width in column, mobile: bottom sheet) */}
            <CollapsibleCommentSidebar
              ref={commentSidebarRef}
              title="Comments"
              storageKey="option_comments_collapsed"
              comments={optionComments}
              isLoading={decisionComments.isLoading}
              readOnly={readOnly}
              onAddComment={async (params) => {
                await decisionComments.addComment({
                  ...params,
                  refEntityType: 'option',
                  refEntityId: optionId,
                  refEntityLabel: option.name || 'Untitled',
                })
              }}
              onDeleteComment={decisionComments.deleteComment}
              onEditComment={decisionComments.editComment}
              currentUserId={session?.user?.id ?? null}
              filterRefEntityId={optionId}
              filterRefEntityLabel={option.name || 'Untitled'}
              inline
            />

            {/* Done button (desktop) */}
            <div className="hidden md:flex pt-3 border-t border-cream/10 justify-end">
              <Link
                href={`/app/tools/finish-decisions/decision/${decisionId}`}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  readOnly
                    ? 'bg-cream/10 text-cream/60 hover:bg-cream/20'
                    : 'bg-sandstone text-basalt hover:bg-sandstone-light'
                }`}
              >
                Done
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile-only footer: delete + done */}
        <div className="md:hidden mt-6">
            {!readOnly ? (
              <div className="pt-3 border-t border-cream/10 flex items-center justify-between">
                <button type="button" onClick={deleteOption} className="text-red-400/60 hover:text-red-400 text-sm transition-colors">
                  Delete option
                </button>
                <Link
                  href={`/app/tools/finish-decisions/decision/${decisionId}`}
                  className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                >
                  Done
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-cream/10 flex justify-end">
                <Link
                  href={`/app/tools/finish-decisions/decision/${decisionId}`}
                  className="px-4 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors"
                >
                  Done
                </Link>
              </div>
            )}
          </div>
        </div>

      {/* Move/Copy sheet */}
      {moveSheetOpen && (
        <MoveIdeaSheet
          options={[option]}
          sourceSelectionId={decisionId}
          selections={v4State.selections}
          onMove={(targetId, newTitle) => moveOptionToSelection(targetId, newTitle)}
          onCopy={(targetId, newTitle) => copyOptionToSelection(targetId, newTitle)}
          onClose={() => setMoveSheetOpen(false)}
        />
      )}

      {/* Toast */}
      {assignToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-sandstone text-basalt text-sm font-medium rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          {assignToast}
        </div>
      )}
    </div>
  )
}

