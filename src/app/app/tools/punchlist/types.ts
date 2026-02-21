export type PunchlistStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE'
export type PunchlistPriority = 'LOW' | 'MED' | 'HIGH'

export interface PunchlistPhoto {
  id: string
  url: string
  caption?: string
  uploadedAt: string
}

export interface PunchlistItem {
  id: string
  title: string
  location: string
  status: PunchlistStatus
  assigneeLabel: string
  priority?: PunchlistPriority
  notes?: string
  photos: PunchlistPhoto[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface PunchlistPayload {
  version: 1
  items: PunchlistItem[]
}
