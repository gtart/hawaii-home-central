'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  ROOM_TYPE_OPTIONS_V3,
  type RoomV3,
  type RoomTypeV3,
} from '@/data/finish-decisions'

export function AddRoomModal({
  onClose,
  onAdd,
  existingRooms,
}: {
  onClose: () => void
  onAdd: (type: RoomTypeV3, name: string, useDefaults: boolean) => void
  existingRooms: RoomV3[]
}) {
  const [roomType, setRoomType] = useState<RoomTypeV3>('kitchen')
  const [roomName, setRoomName] = useState('')
  const [useDefaults, setUseDefaults] = useState(true)
  const [error, setError] = useState('')

  // Auto-fill name based on type with auto-increment for duplicates
  useEffect(() => {
    const label = ROOM_TYPE_OPTIONS_V3.find((opt) => opt.value === roomType)?.label || ''

    // Find existing rooms with similar names
    const existingNames = existingRooms.map((r) => r.name.toLowerCase())

    // Check if base name exists
    if (!existingNames.includes(label.toLowerCase())) {
      setRoomName(label)
    } else {
      // Find next available number
      let counter = 2
      let newName = `${label} #${counter}`
      while (existingNames.includes(newName.toLowerCase())) {
        counter++
        newName = `${label} #${counter}`
      }
      setRoomName(newName)
    }
  }, [roomType, existingRooms])

  const handleAdd = () => {
    if (!roomName.trim()) {
      setError('Room name is required')
      return
    }

    onAdd(roomType, roomName.trim(), useDefaults)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-basalt/80 flex items-center justify-center z-50 p-4">
      <div className="bg-basalt-50 rounded-card p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-serif text-sandstone">Add Room or Area</h3>

        <Select
          label="Room or Area Type"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomTypeV3)}
          options={ROOM_TYPE_OPTIONS_V3.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        <Input
          label="Name"
          placeholder="e.g., Main Kitchen, Master Bath"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          error={error}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="use-defaults"
            checked={useDefaults}
            onChange={(e) => setUseDefaults(e.target.checked)}
            className="accent-sandstone"
          />
          <label htmlFor="use-defaults" className="text-sm text-cream/80">
            Start with suggested selections
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleAdd}>Create Room</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
