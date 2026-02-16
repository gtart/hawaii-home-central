'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { type OptionV3 } from '@/data/finish-decisions'

export function OptionEditor({
  option,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: {
  option: OptionV3
  isSelected?: boolean
  onUpdate: (updates: Partial<OptionV3>) => void
  onDelete: () => void
  onSelect?: () => void
}) {
  const [newUrl, setNewUrl] = useState('')

  const handleAddUrl = () => {
    if (!newUrl.trim()) return

    onUpdate({
      urls: [
        ...option.urls,
        {
          id: crypto.randomUUID(),
          url: newUrl.trim(),
        },
      ],
    })

    setNewUrl('')
  }

  const handleRemoveUrl = (urlId: string) => {
    onUpdate({
      urls: option.urls.filter((u) => u.id !== urlId),
    })
  }

  const isValidUrl = (url: string) => {
    return /^https?:\/\/.+/i.test(url)
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={option.isSelected || false}
            onChange={(e) => onUpdate({ isSelected: e.target.checked })}
            className="accent-sandstone"
          />
          <span className="text-cream font-medium">
            {option.name || 'Unnamed Option'}
          </span>
        </div>
        <button onClick={onDelete} className="text-red-400/60 hover:text-red-400 text-xs">
          Delete
        </button>
      </div>

      <div className="space-y-3">
        <Input
          label="Option Name"
          placeholder="e.g., Quartz Calacatta Gold"
          value={option.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />

        {/* URLs Section */}
        <div>
          <label className="block text-sm text-cream/70 mb-2">URLs</label>
          {option.urls.length > 0 && (
            <div className="space-y-2 mb-3">
              {option.urls.map((url) => (
                <div key={url.id} className="flex items-center gap-2 bg-basalt p-2 rounded">
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sandstone hover:text-sandstone-light text-sm flex-1 truncate"
                  >
                    {url.url}
                  </a>
                  <button
                    onClick={() => handleRemoveUrl(url.id)}
                    className="text-cream/40 hover:text-cream/70 text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="secondary" onClick={handleAddUrl}>
              Add
            </Button>
          </div>
          {newUrl && !isValidUrl(newUrl) && (
            <p className="text-yellow-500 text-xs mt-1">
              URL should start with http:// or https://
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
          <textarea
            value={option.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[100px]"
            placeholder="Specs, notes, details about this option..."
          />
        </div>
      </div>
    </div>
  )
}
