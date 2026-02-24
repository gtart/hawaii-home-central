'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionsPayloadV3, OptionV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, type RoomTypeV3 } from '@/data/finish-decisions'

const DEFAULT_PAYLOAD: FinishDecisionsPayloadV3 = { version: 3, rooms: [] }
const BOOKMARKLET_STORAGE_KEY = 'hhc_bookmarklet_pending'

interface BookmarkletData {
  title: string
  images: Array<{ url: string; label?: string }>
  url: string
}

export function SaveFromWebContent() {
  const router = useRouter()

  const { currentProject, projects, isLoading: projectsLoading } = useProject()

  const { state, setState, isLoaded, readOnly } = useToolState<FinishDecisionsPayloadV3>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: DEFAULT_PAYLOAD,
  })

  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [bookmarkletData, setBookmarkletData] = useState<BookmarkletData | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  // Parse bookmarklet data from sessionStorage (primary) or hash fragment (backup)
  useEffect(() => {
    let payload: string | null = null

    // 1. Check sessionStorage first (survives auth redirects)
    try {
      payload = sessionStorage.getItem(BOOKMARKLET_STORAGE_KEY)
      if (payload) sessionStorage.removeItem(BOOKMARKLET_STORAGE_KEY)
    } catch { /* ignore */ }

    // 2. Fall back to hash fragment
    if (!payload) {
      const hash = window.location.hash
      if (hash.startsWith('#bookmarklet=')) {
        try {
          const b64 = hash.slice('#bookmarklet='.length)
          payload = decodeURIComponent(escape(atob(b64)))
        } catch { /* ignore */ }
        // Clear hash to prevent re-import on refresh
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    if (!payload) return

    try {
      const data = JSON.parse(payload) as BookmarkletData
      if (data.url && Array.isArray(data.images)) {
        setBookmarkletData(data)
        setName(data.title || '')
        // Pre-select the first image (usually OG image) if available
        if (data.images.length > 0) {
          setSelectedUrls(new Set([data.images[0].url]))
        }
      }
    } catch { /* ignore malformed data */ }
  }, [])

  const rooms = (state as FinishDecisionsPayloadV3).rooms || []

  // Flatten decisions with room context for the picker
  const decisionOptions = rooms.flatMap((room) =>
    room.decisions.map((d) => ({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type as RoomTypeV3,
      decisionId: d.id,
      decisionTitle: d.title,
    })),
  )

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

  const handleSave = () => {
    if (!selectedDecisionId || !bookmarkletData) return

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

    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) => ({
        ...r,
        decisions: r.decisions.map((d) =>
          d.id === selectedDecisionId
            ? {
                ...d,
                options: [...d.options, newOption],
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
        updatedAt: new Date().toISOString(),
      })),
    }))

    setSaved(true)
  }

  // Generate bookmarklet javascript: URL dynamically from current origin
  const bookmarkletHref = useMemo(() => {
    if (typeof window === 'undefined') return '#'
    const origin = window.location.origin
    // Minified bookmarklet script
    return `javascript:void(function(){var d=document,t=d.title||'',o='',m=d.querySelector('meta[property="og:image"]');if(m)o=m.getAttribute('content')||'';var i=[],s={};function a(u){try{return new URL(u,location.href).href}catch(e){return''}}if(o){var r=a(o);if(r){s[r]=1;i.push({url:r,label:'Primary'})}}var g=d.getElementsByTagName('img');for(var j=0;j<g.length&&i.length<20;j++){var e=g[j];if(e.naturalWidth>0&&e.naturalWidth<=150)continue;if(e.naturalHeight>0&&e.naturalHeight<=150)continue;var c=e.getAttribute('data-src')||e.getAttribute('data-lazy-src')||e.src||'';if(!c||c.indexOf('data:')===0)continue;if(/\\.svg(\\?|$)/i.test(c))continue;var r=a(c);if(!r||s[r])continue;s[r]=1;var l=e.alt||e.title||'';i.push({url:r,label:l.substring(0,80)})}var p=JSON.stringify({title:t.substring(0,120),images:i,url:location.href});try{sessionStorage.setItem('hhc_bookmarklet_pending',p)}catch(x){}var b=btoa(unescape(encodeURIComponent(p)));window.open('${origin}/app/save-from-web#bookmarklet='+b,'_blank')}())`
  }, [])

  // Extract hostname for display
  const sourceHost = bookmarkletData?.url
    ? (() => { try { return new URL(bookmarkletData.url).hostname.replace(/^www\./, '') } catch { return '' } })()
    : ''

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

  // Success state
  if (saved) {
    const target = decisionOptions.find((d) => d.decisionId === selectedDecisionId)
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="font-serif text-2xl text-sandstone mb-2">Idea saved!</h1>
          {target && (
            <p className="text-cream/60 text-sm mb-6">
              Added to {target.decisionTitle} in {target.roomName}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSaved(false)
                setBookmarkletData(null)
                setSelectedUrls(new Set())
                setName('')
                setNotes('')
              }}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
            >
              Save another
            </button>
            <button
              type="button"
              onClick={() => {
                if (target) {
                  router.push(`/app/tools/finish-decisions/decision/${target.decisionId}`)
                } else {
                  router.push('/app/tools/finish-decisions')
                }
              }}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              View in Selections
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.push('/app/tools/finish-decisions')}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; Back to Selections
        </button>

        <h1 className="font-serif text-2xl md:text-3xl text-sandstone mb-2">
          Save from Web
        </h1>
        <p className="text-cream/60 text-sm mb-6">
          {bookmarkletData
            ? <>Images captured from <span className="text-cream/80">{sourceHost}</span></>
            : 'Save product ideas from any website.'}
        </p>

        {/* Destination picker */}
        {decisionOptions.length === 0 ? (
          <div className="bg-basalt-50 rounded-lg p-6 text-center mb-6">
            <p className="text-cream/50 text-sm mb-3">
              No selections yet. Add rooms and selections first.
            </p>
            <button
              type="button"
              onClick={() => router.push('/app/tools/finish-decisions')}
              className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
            >
              Go to Finish Selections
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-xs text-cream/50 mb-2">Save to selection</label>
            <select
              value={selectedDecisionId || ''}
              onChange={(e) => setSelectedDecisionId(e.target.value || null)}
              className="w-full bg-basalt-50 border border-cream/20 text-cream text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-sandstone"
            >
              <option value="">Choose a selection...</option>
              {rooms.map((room) => (
                <optgroup
                  key={room.id}
                  label={`${ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'} ${room.name}`}
                >
                  {room.decisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Bookmarklet mode: image picker + name/notes + save */}
        {selectedDecisionId && bookmarkletData && (
          <div className="bg-basalt-50 rounded-xl p-4 border border-cream/10 space-y-4">
            {/* Source info */}
            <div className="bg-basalt rounded-lg p-3 border border-cream/10">
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
                <p className="text-xs text-cream/50 mb-2">
                  Select images to import ({selectedUrls.size} selected)
                </p>
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
                        <img
                          src={proxyUrl(img.url)}
                          alt={img.label || ''}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
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
              <div className="bg-basalt rounded-lg p-4 text-center">
                <p className="text-xs text-cream/50 mb-1">
                  No images found on this page.
                </p>
                <p className="text-[11px] text-cream/30">
                  You can still save this URL as an idea.
                </p>
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

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBookmarkletData(null)
                  setSelectedUrls(new Set())
                  setName('')
                  setNotes('')
                }}
                className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Idea
              </button>
            </div>
          </div>
        )}

        {/* No bookmarklet data: show setup instructions */}
        {!bookmarkletData && selectedDecisionId && (
          <div className="bg-basalt-50 rounded-xl p-5 border border-cream/10">
            <h2 className="text-sm font-medium text-cream mb-4">How to save from any website</h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm text-cream/80 mb-2">Drag this button to your bookmarks bar:</p>
                  {/* eslint-disable-next-line no-script-url */}
                  <a
                    href={bookmarkletHref}
                    onClick={(e) => {
                      e.preventDefault()
                      alert('Drag this button to your bookmarks bar — don\'t click it!')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg cursor-grab active:cursor-grabbing select-none"
                    title="Drag me to your bookmarks bar"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Save to HHC
                  </a>
                  <p className="text-[11px] text-cream/30 mt-1.5">
                    On Safari: right-click the button, select &quot;Add to Bookmarks&quot;
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm text-cream/80">Visit any product page</p>
                  <p className="text-xs text-cream/40 mt-0.5">Home Depot, Lowes, Wayfair, Amazon, etc.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-sandstone/20 text-sandstone text-xs font-bold rounded-full flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm text-cream/80">Click &quot;Save to HHC&quot; in your bookmarks bar</p>
                  <p className="text-xs text-cream/40 mt-0.5">Product images will be captured and brought here for you to save.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-cream/10">
              <p className="text-[11px] text-cream/30">
                Works on desktop browsers (Chrome, Firefox, Safari, Edge). Not available on mobile.
              </p>
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
