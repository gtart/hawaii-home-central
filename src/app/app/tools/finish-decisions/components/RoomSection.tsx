'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  ROOM_TYPE_OPTIONS_V3,
  type RoomV3,
  type DecisionV3,
} from '@/data/finish-decisions'
import { DecisionsTable } from './DecisionsTable'

export function RoomSection({
  room,
  isExpanded,
  onToggleExpand,
  onUpdateRoom,
  onDeleteRoom,
}: {
  room: RoomV3
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateRoom: (updates: Partial<RoomV3>) => void
  onDeleteRoom: () => void
}) {
  const [newDecisionTitle, setNewDecisionTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const stats = {
    total: room.decisions.length,
    selected: room.decisions.filter((d) => d.status === 'selected').length,
    ordered: room.decisions.filter((d) => d.status === 'ordered').length,
    done: room.decisions.filter((d) => d.status === 'done').length,
  }

  const summaryParts: string[] = []
  summaryParts.push(`${stats.total} total`)
  if (stats.selected > 0) summaryParts.push(`${stats.selected} selected`)
  if (stats.ordered > 0) summaryParts.push(`${stats.ordered} ordered`)
  if (stats.done > 0) summaryParts.push(`${stats.done} done`)

  const handleAddDecision = () => {
    if (!newDecisionTitle.trim()) return

    const newDecision: DecisionV3 = {
      id: crypto.randomUUID(),
      title: newDecisionTitle.trim(),
      status: 'deciding',
      notes: '',
      options: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onUpdateRoom({
      decisions: [...room.decisions, newDecision],
      updatedAt: new Date().toISOString(),
    })

    setNewDecisionTitle('')
    setShowAddForm(false)
  }

  const deleteDecision = (decisionId: string) => {
    if (confirm(`Delete this decision? This will also delete all its options.`)) {
      onUpdateRoom({
        decisions: room.decisions.filter((d) => d.id !== decisionId),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const roomTypeLabel = ROOM_TYPE_OPTIONS_V3.find((t) => t.value === room.type)?.label

  return (
    <div className="bg-basalt-50 rounded-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-basalt-50/80 transition-colors"
        onClick={onToggleExpand}
      >
        <span className="text-cream/50 text-sm select-none">
          {isExpanded ? '▼' : '▶'}
        </span>

        <h3 className="text-cream font-medium text-lg flex-1">{room.name}</h3>

        <Badge variant="default" className="text-xs">
          {roomTypeLabel}
        </Badge>

        <span className="text-xs text-cream/50">
          {summaryParts.join(', ')}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete ${room.name}? This will also delete all decisions and options.`)) {
              onDeleteRoom()
            }
          }}
          className="text-red-400/60 hover:text-red-400 text-xs ml-2"
        >
          Delete
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-cream/10 px-4 py-4">
          {/* Add Decision */}
          <div className="flex items-center gap-2 mb-4">
            {showAddForm ? (
              <div className="flex gap-2 flex-1">
                <Input
                  placeholder="Decision title (e.g., Countertop)"
                  value={newDecisionTitle}
                  onChange={(e) => setNewDecisionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDecision()
                    if (e.key === 'Escape') {
                      setShowAddForm(false)
                      setNewDecisionTitle('')
                    }
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddDecision}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewDecisionTitle('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddForm(true)
                }}
              >
                + Add Decision
              </Button>
            )}
          </div>

          {/* Decisions Table */}
          <DecisionsTable
            decisions={room.decisions}
            onDeleteDecision={deleteDecision}
          />
        </div>
      )}
    </div>
  )
}
