'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { UnifiedShareModal, type ScopeOption } from './UnifiedShareModal'
import { HeaderMoreMenu } from './HeaderMoreMenu'
import { cn } from '@/lib/utils'

interface Collaborator {
  id: string
  userId: string
  name: string | null
  email: string | null
  image: string | null
  level: 'VIEW' | 'EDIT'
}

interface PendingInvite {
  id: string
  email: string
  level: 'VIEW' | 'EDIT'
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

interface ToolPageHeaderProps {
  toolKey: string
  title: string
  description: string
  /** Actual access level from the tool's API response. */
  accessLevel?: 'OWNER' | 'EDIT' | 'VIEW' | null
  /** Whether the tool has any user-created content. When false, the invite button is de-emphasized. */
  hasContent?: boolean
  /** Action buttons rendered in the top-right header area (next to Share button). */
  actions?: React.ReactNode
  children?: React.ReactNode
  /** When set, use collection-based share endpoints instead of legacy project-based ones */
  collectionId?: string
  /** Instance name shown in share modal title when collectionId is set */
  collectionName?: string
  /** Small label above H1 when viewing an instance, e.g. "FIX LIST" */
  eyebrowLabel?: string
  /** Override back link destination (e.g. picker page) */
  backHref?: string
  /** Override back link text (e.g. "All Fix Lists") */
  backLabel?: string
  /** Slot for InstanceSwitcher dropdown, rendered next to the title */
  headerSlot?: React.ReactNode
  /** User-facing label for this tool (e.g. "Fix List") */
  toolLabel?: string
  /** Scope options for UnifiedShareModal export tab */
  scopes?: ScopeOption[]
  /** Label for scope picker (e.g. "rooms", "areas") */
  scopeLabel?: string
  /** Build export URL for print preview */
  buildExportUrl?: (opts: { projectId: string; includeNotes: boolean; includeComments: boolean; includePhotos: boolean; scopeMode: 'all' | 'selected'; selectedScopeIds: string[] }) => string
  /** Extra controls for export tab (e.g. punchlist status filters) */
  extraExportControls?: React.ReactNode
  /** Custom badge renderer for share link tokens */
  renderTokenBadges?: (token: { statuses?: string[]; locations?: string[]; assignees?: string[] }) => React.ReactNode
  /** Initial scope IDs for export tab */
  initialSelectedScopeIds?: string[]
  /** Custom link tab content for UnifiedShareModal (replaces default) */
  customLinkTab?: React.ReactNode
  /** Callback when user renames the instance */
  onRename?: (newTitle: string) => void
  /** Callback when user archives the instance */
  onArchive?: () => void
}

export function ToolPageHeader({
  toolKey,
  title,
  description,
  accessLevel,
  hasContent = true,
  actions,
  children,
  collectionId,
  collectionName,
  eyebrowLabel,
  backHref,
  backLabel,
  headerSlot,
  toolLabel,
  scopes = [],
  scopeLabel = 'items',
  buildExportUrl,
  extraExportControls,
  renderTokenBadges,
  initialSelectedScopeIds,
  customLinkTab,
  onRename,
  onArchive,
}: ToolPageHeaderProps) {
  const { currentProject } = useProject()
  const searchParams = useSearchParams()
  const [showShare, setShowShare] = useState(false)
  const [shareInitialTab, setShareInitialTab] = useState<'people' | 'link' | 'export'>('people')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const isOwner = accessLevel === 'OWNER' || currentProject?.role === 'OWNER'

  // Auto-open share modal from ?openShare=1 deep link
  useEffect(() => {
    if (searchParams.get('openShare') === '1' && isOwner && !showShare) {
      setShareInitialTab('link')
      setShowShare(true)
    }
  }, [searchParams, isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollaborators = useCallback(async () => {
    if (!isOwner) return
    try {
      if (collectionId) {
        const res = await fetch(`/api/collections/${collectionId}/share`)
        if (!res.ok) return
        const data = await res.json()
        setCollaborators(
          (data.members ?? []).map((m: { id: string; userId: string; role: string; user: { name: string | null; email: string | null; image: string | null } }) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
            level: m.role === 'EDITOR' ? 'EDIT' : 'VIEW',
          } as Collaborator))
        )
        setPendingInvites(
          (data.invites ?? []).map((inv: { id: string; email: string; role: string }) => ({
            id: inv.id,
            email: inv.email,
            level: inv.role === 'EDITOR' ? 'EDIT' : 'VIEW',
          } as PendingInvite))
        )
      } else {
        if (!currentProject?.id) return
        const res = await fetch(`/api/projects/${currentProject.id}/tools/${toolKey}/share`)
        if (!res.ok) return
        const data = await res.json()
        setCollaborators(data.access ?? [])
        setPendingInvites(
          (data.invites ?? []).map((inv: { id: string; email: string; level: string }) => ({
            id: inv.id,
            email: inv.email,
            level: inv.level as 'VIEW' | 'EDIT',
          }))
        )
      }
    } catch {
      // silent
    }
  }, [isOwner, currentProject?.id, toolKey, collectionId])

  useEffect(() => {
    loadCollaborators()
  }, [loadCollaborators])

  const handleShareClose = () => {
    setShowShare(false)
    loadCollaborators()
  }

  const handleRenameStart = () => {
    setRenameValue(collectionName || title)
    setRenaming(true)
  }

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== (collectionName || title) && onRename) {
      onRename(trimmed)
    }
    setRenaming(false)
  }

  const totalPeople = collaborators.length + pendingInvites.length

  return (
    <>
      <div className="flex items-center gap-1.5 mb-4 text-sm">
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/60 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Tools
        </Link>
        <span className="text-cream/20">/</span>
        {backHref ? (
          <Link href={backHref} className="text-cream/40 hover:text-cream/60 transition-colors">
            {toolLabel || backLabel || title}
          </Link>
        ) : (
          <span className="text-cream/60">{toolLabel || title}</span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 mb-4">
        <div className="min-w-0">
          {collectionName ? (
            <p className="text-xs text-cream/40 uppercase tracking-wider mb-1">
              {eyebrowLabel || title}
            </p>
          ) : currentProject ? (
            <p className="text-xs text-cream/40 uppercase tracking-wider mb-1">{currentProject.name}</p>
          ) : null}
          <div className="flex items-center gap-3">
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                onBlur={handleRenameSubmit}
                className="font-serif text-4xl md:text-5xl text-sandstone bg-transparent border-b-2 border-sandstone/30 focus:border-sandstone outline-none min-w-0"
              />
            ) : (
              <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
                {collectionName || title}
              </h1>
            )}
            {isOwner && (onRename || onArchive) && (
              <HeaderMoreMenu
                onRename={onRename ? handleRenameStart : undefined}
                onArchive={onArchive}
              />
            )}
            {headerSlot}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-2">
          {accessLevel === 'VIEW' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream/10 text-cream/50">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View only
            </span>
          )}
          {accessLevel === 'EDIT' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sandstone/15 text-sandstone">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Can edit
            </span>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => { setShareInitialTab('people'); setShowShare(true) }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                hasContent
                  ? 'bg-sandstone text-basalt hover:bg-sandstone-light'
                  : 'text-cream/40 hover:text-cream/70'
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Share
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Collaborator pills */}
      {isOwner && totalPeople > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-cream/40 uppercase tracking-wider">Shared with</span>

          {collaborators.map((c) => (
            <div
              key={c.id}
              title={`${c.name || c.email || 'Collaborator'} — ${c.level === 'EDIT' ? 'Can edit' : 'View only'}`}
              className={cn(
                'group relative inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium cursor-default',
                c.level === 'EDIT'
                  ? 'bg-sandstone/15 text-sandstone'
                  : 'bg-cream/10 text-cream/60'
              )}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  width={22}
                  height={22}
                  className="w-[22px] h-[22px] rounded-full object-cover"
                />
              ) : (
                <span className={cn(
                  'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold',
                  c.level === 'EDIT'
                    ? 'bg-sandstone/25 text-sandstone'
                    : 'bg-cream/15 text-cream/50'
                )}>
                  {getInitials(c.name, c.email)}
                </span>
              )}
              <span className="leading-none">{getInitials(c.name, c.email)}</span>

              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-basalt-50 border border-cream/15 text-xs text-cream whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-10">
                {c.name || c.email}
                <span className="text-cream/40 ml-1">
                  ({c.level === 'EDIT' ? 'Can edit' : 'View only'})
                </span>
              </span>
            </div>
          ))}

          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              title={`${inv.email} — Pending invite (${inv.level === 'EDIT' ? 'Can edit' : 'View only'})`}
              className="group relative inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium bg-cream/5 text-cream/35 border border-dashed border-cream/15 cursor-default"
            >
              <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold bg-cream/8 text-cream/30">
                {inv.email.slice(0, 2).toUpperCase()}
              </span>
              <span className="leading-none">{inv.email.split('@')[0]}</span>

              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-basalt-50 border border-cream/15 text-xs text-cream whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-10">
                {inv.email}
                <span className="text-cream/40 ml-1">(Pending)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {!collectionName && (
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          {description}
        </p>
      )}

      {children}

      {showShare && currentProject && (
        <UnifiedShareModal
          projectId={currentProject.id}
          toolKey={toolKey}
          toolLabel={toolLabel || title}
          onClose={handleShareClose}
          collectionId={collectionId}
          collectionName={collectionName}
          isOwner={isOwner}
          scopes={scopes}
          scopeLabel={scopeLabel}
          buildExportUrl={buildExportUrl || (() => '#')}
          extraExportControls={extraExportControls}
          renderTokenBadges={renderTokenBadges}
          initialTab={shareInitialTab}
          initialSelectedScopeIds={initialSelectedScopeIds}
          customLinkTab={customLinkTab}
        />
      )}
    </>
  )
}
