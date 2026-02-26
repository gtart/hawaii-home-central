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

// ---------------------------------------------------------------------------
// Public (share link) shapes — whitelist of fields safe for external viewers.
// No internal IDs, no emails, photos opt-in.
// ---------------------------------------------------------------------------

export interface PublicPunchlistPhoto {
  url: string
  thumbnailUrl?: string
}

export interface PublicPunchlistComment {
  authorName: string
  text: string
  createdAt: string
}

export interface PublicPunchlistItem {
  itemNumber: number
  title: string
  location: string
  status: PunchlistStatus
  assigneeLabel: string
  priority?: PunchlistPriority
  notes?: string
  comments?: PublicPunchlistComment[]
  photos: PublicPunchlistPhoto[]
  createdAt: string
  completedAt?: string
}

/** Whitelist-map a full PunchlistItem to a safe public shape. */
export function toPublicItem(
  item: PunchlistItem,
  opts: { includeNotes: boolean; includeComments: boolean; includePhotos: boolean }
): PublicPunchlistItem {
  const pub: PublicPunchlistItem = {
    itemNumber: item.itemNumber,
    title: item.title,
    location: item.location,
    status: item.status,
    assigneeLabel: item.assigneeLabel,
    priority: item.priority,
    photos: opts.includePhotos
      ? item.photos.map((p) => ({ url: p.url, thumbnailUrl: p.thumbnailUrl }))
      : [],
    createdAt: item.createdAt,
    completedAt: item.completedAt,
  }
  if (opts.includeNotes && item.notes) {
    pub.notes = item.notes
  }
  if (opts.includeComments && item.comments && item.comments.length > 0) {
    pub.comments = item.comments.map((c) => ({
      authorName: c.authorName,
      text: c.text,
      createdAt: c.createdAt,
    }))
  }
  return pub
}
