export type PunchlistStatus = 'OPEN' | 'ACCEPTED' | 'DONE'
export type PunchlistPriority = 'LOW' | 'MED' | 'HIGH'

export interface PunchlistPhoto {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedAt: string
}

export interface PunchlistComment {
  id: string
  text: string
  authorName: string
  authorEmail: string
  createdAt: string
}

export interface PunchlistItem {
  id: string
  itemNumber: number
  title: string
  location: string
  status: PunchlistStatus
  assigneeLabel: string
  priority?: PunchlistPriority
  notes?: string
  comments?: PunchlistComment[]
  photos: PunchlistPhoto[]
  createdByName?: string
  createdByEmail?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface PunchlistPayload {
  version: 3
  nextItemNumber: number
  items: PunchlistItem[]
}
