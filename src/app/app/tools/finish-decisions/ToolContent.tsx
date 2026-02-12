'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/resources/ShareButton'
import { useToolState } from '@/hooks/useToolState'
import {
  CATEGORY_OPTIONS,
  STATUS_CONFIG,
  NEEDED_BY_OPTIONS,
  type DecisionItem,
  type DecisionStatus,
  type NeededByStage,
  type FinishDecisionsPayload,
} from '@/data/finish-decisions'

// Quick Add Row Component
function QuickAddRow({
  onAdd,
}: {
  onAdd: (room: string, category: string, name: string, status: DecisionStatus) => void
}) {
  const [room, setRoom] = useState('')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<DecisionStatus>('deciding')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!category) {
      setError('Category is required')
      return
    }
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    onAdd(room, category, name.trim(), status)
    setRoom('')
    setCategory('')
    setName('')
    setStatus('deciding')
    setError('')
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6">
      <h2 className="text-sm font-medium text-cream/70 mb-3">Quick Add</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input
          placeholder="Room (optional)"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: '', label: '-- Category --' },
            ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as DecisionStatus)}
          options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}

// Filter Bar Component
function FilterBar({
  searchQuery,
  onSearchChange,
  filterRoom,
  onRoomChange,
  filterStatus,
  onStatusChange,
  filterCategory,
  onCategoryChange,
  rooms,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterRoom: string
  onRoomChange: (value: string) => void
  filterStatus: DecisionStatus | 'all'
  onStatusChange: (value: DecisionStatus | 'all') => void
  filterCategory: string
  onCategoryChange: (value: string) => void
  rooms: string[]
}) {
  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={filterRoom}
          onChange={(e) => onRoomChange(e.target.value)}
          options={[
            { value: 'all', label: 'All Rooms' },
            ...rooms.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value as DecisionStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            })),
          ]}
        />
        <Select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[
            { value: 'all', label: 'All Categories' },
            ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>
    </div>
  )
}

// Progress Summary Component
function ProgressSummary({ items }: { items: DecisionItem[] }) {
  const inProgress = items.filter(
    (i) => i.status === 'deciding' || i.status === 'awaiting_approval'
  ).length
  const locked = items.filter((i) => i.status === 'final').length
  const done = items.filter((i) => i.status === 'complete').length

  return (
    <div className="flex items-center gap-6 mb-6 text-sm">
      <span className="text-cream/70">
        In Progress: <span className="text-sandstone font-medium">{inProgress}</span>
      </span>
      <span className="text-cream/70">
        Locked: <span className="text-sandstone font-medium">{locked}</span>
      </span>
      <span className="text-cream/70">
        Done: <span className="text-cream/50 font-medium">{done}</span>
      </span>
      <span className="text-cream/50 ml-auto">
        Total: {items.length} item{items.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// Item Row Component
function ItemRow({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  item: DecisionItem
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DecisionItem>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="border-b border-cream/10 last:border-0">
      <div
        onClick={onSelect}
        className="py-3 px-4 cursor-pointer hover:bg-basalt-50/50 transition-colors flex items-center gap-3"
      >
        {item.room && (
          <span className="text-xs text-cream/50 bg-basalt/50 px-2 py-1 rounded">
            {item.room}
          </span>
        )}
        <span className="text-xs text-sandstone/70">{item.category}</span>
        <span className="text-cream flex-1">{item.name}</span>
        <Badge variant={STATUS_CONFIG[item.status].variant}>
          {STATUS_CONFIG[item.status].label}
        </Badge>
        {item.links.length > 0 && (
          <span className="text-xs text-cream/40">{item.links.length} link{item.links.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      {isSelected && (
        <EditPanel
          item={item}
          onUpdate={onUpdate}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

// Edit Panel Component
function EditPanel({
  item,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  item: DecisionItem
  onUpdate: (updates: Partial<DecisionItem>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return

    const newLink = {
      id: crypto.randomUUID(),
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
    }

    onUpdate({ links: [...item.links, newLink] })
    setNewLinkLabel('')
    setNewLinkUrl('')
  }

  const handleRemoveLink = (linkId: string) => {
    onUpdate({ links: item.links.filter((l) => l.id !== linkId) })
  }

  const isValidUrl = (url: string) => {
    return /^https?:\/\/.+/i.test(url)
  }

  return (
    <div className="bg-basalt-50 p-6 mb-4 mx-4 rounded-card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Room"
          value={item.room}
          onChange={(e) => onUpdate({ room: e.target.value })}
        />
        <Select
          label="Category"
          value={item.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <Input
        label="Name"
        value={item.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Where (store/vendor)"
          value={item.where}
          onChange={(e) => onUpdate({ where: e.target.value })}
        />
        <Select
          label="Status"
          value={item.status}
          onChange={(e) => onUpdate({ status: e.target.value as DecisionStatus })}
          options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
        />
      </div>

      <div>
        <label className="block text-sm text-cream/70 mb-1.5">Specs</label>
        <textarea
          value={item.specs}
          onChange={(e) => onUpdate({ specs: e.target.value })}
          className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[80px]"
          placeholder="Detailed specifications..."
        />
      </div>

      <Select
        label="Needed By Stage"
        value={item.neededBy || ''}
        onChange={(e) =>
          onUpdate({ neededBy: (e.target.value as NeededByStage) || null })
        }
        options={[
          { value: '', label: '-- Not set --' },
          ...NEEDED_BY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
        ]}
      />

      {/* Links Section */}
      <div>
        <label className="block text-sm text-cream/70 mb-2">Links</label>
        {item.links.length > 0 && (
          <div className="space-y-2 mb-3">
            {item.links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 bg-basalt p-2 rounded"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sandstone hover:text-sandstone-light text-sm flex-1 truncate"
                >
                  {link.label || link.url}
                </a>
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  className="text-cream/40 hover:text-cream/70 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Label (optional)"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
          />
          <Input
            placeholder="URL"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
          <Button variant="secondary" onClick={handleAddLink}>
            Add Link
          </Button>
        </div>
        {newLinkUrl && !isValidUrl(newLinkUrl) && (
          <p className="text-yellow-500 text-xs mt-1">
            URL should start with http:// or https://
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
        <textarea
          value={item.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[60px]"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

// Main Tool Content Component
export function ToolContent() {
  const { state, setState, isLoaded, isSyncing } = useToolState<FinishDecisionsPayload>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v1',
    defaultValue: { version: 1, items: [] },
  })

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | 'all'>('all')
  const [filterRoom, setFilterRoom] = useState<string | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all')

  // Add new item
  const handleQuickAdd = (
    room: string,
    category: string,
    name: string,
    status: DecisionStatus
  ) => {
    const newItem: DecisionItem = {
      id: crypto.randomUUID(),
      room: room.trim(),
      category,
      name,
      specs: '',
      where: '',
      status,
      neededBy: null,
      links: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => ({ ...prev, items: [newItem, ...prev.items] }))
    setSelectedItemId(newItem.id)
  }

  // Update item
  const updateItem = (itemId: string, updates: Partial<DecisionItem>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    }))
  }

  // Delete item
  const deleteItem = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }))
    setSelectedItemId(null)
  }

  // Duplicate item
  const duplicateItem = (itemId: string) => {
    const original = state.items.find((i) => i.id === itemId)
    if (!original) return

    const duplicate: DecisionItem = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => ({ ...prev, items: [duplicate, ...prev.items] }))
    setSelectedItemId(duplicate.id)
  }

  // Get unique rooms
  const uniqueRooms = useMemo(() => {
    const rooms = new Set(state.items.map((item) => item.room).filter(Boolean))
    return Array.from(rooms).sort()
  }, [state.items])

  // Filter items
  const filteredItems = useMemo(() => {
    return state.items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchable = [item.name, item.specs, item.where, item.notes]
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(query)) return false
      }

      // Room filter
      if (filterRoom !== 'all' && item.room !== filterRoom) return false

      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false

      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) return false

      return true
    })
  }, [state.items, searchQuery, filterRoom, filterStatus, filterCategory])

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Finish Decisions
          </h1>
          <div className="shrink-0 mt-2 flex items-center gap-3">
            {isSyncing && <span className="text-xs text-cream/30">Saving...</span>}
            <ShareButton title="Finish Decisions &mdash; Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Track finish and appliance decisions across rooms. Record specs, vendors,
          needed-by stages, and links for every choice.
        </p>

        <div className="bg-basalt-50 rounded-card p-6 mb-8">
          <h2 className="font-serif text-xl text-sandstone mb-3">
            What are finish decisions?
          </h2>
          <p className="text-cream/70 text-sm leading-relaxed">
            Finish decisions are the material and appliance choices that define your
            renovation: countertops, flooring, fixtures, tile, paint, cabinetry, and more.
            Each decision must be locked in by a specific construction stage to avoid
            delays and change orders.
          </p>
        </div>

        {isLoaded && (
          <>
            <QuickAddRow onAdd={handleQuickAdd} />

            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterRoom={filterRoom}
              onRoomChange={setFilterRoom}
              filterStatus={filterStatus}
              onStatusChange={setFilterStatus}
              filterCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              rooms={uniqueRooms}
            />

            <ProgressSummary items={filteredItems} />

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-cream/50">
                {state.items.length === 0 ? (
                  <p>No items yet. Add your first decision above!</p>
                ) : (
                  <p>No items match your filters.</p>
                )}
              </div>
            ) : (
              <div className="bg-basalt-50 rounded-card">
                {filteredItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onSelect={() =>
                      setSelectedItemId(selectedItemId === item.id ? null : item.id)
                    }
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onDuplicate={() => duplicateItem(item.id)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoaded && (
          <div className="text-center py-12 text-cream/50">
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
