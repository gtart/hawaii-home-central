// ============================================================================
// Mood Boards — Types & Helpers
// ============================================================================

export interface MoodBoardComment {
  id: string
  text: string
  authorName: string
  authorEmail: string
  createdAt: string
  refIdeaId?: string
  refIdeaLabel?: string
}

export type ReactionType = 'love' | 'like' | 'dislike'

export interface IdeaReaction {
  userId: string // email
  userName: string
  reaction: ReactionType
}

export const REACTION_CONFIG: Record<
  ReactionType,
  { emoji: string; label: string }
> = {
  love: { emoji: '\u2764\uFE0F', label: 'Love!' },
  like: { emoji: '\uD83D\uDC4D', label: 'Like' },
  dislike: { emoji: '\uD83D\uDC4E', label: "Don't Like" },
}

export interface IdeaImage {
  id: string
  url: string
  thumbnailUrl?: string
  label?: string
  sourceUrl?: string
}

export interface Idea {
  id: string
  name: string
  notes: string
  images: IdeaImage[]
  heroImageId: string | null
  sourceUrl: string
  sourceTitle: string
  tags: string[]
  reactions?: IdeaReaction[]
  createdAt: string
  updatedAt: string
}

export type BoardAccessLevel = 'edit' | 'view'

export interface BoardAccess {
  email: string
  level: BoardAccessLevel
}

export interface Board {
  id: string
  name: string
  ideas: Idea[]
  comments?: MoodBoardComment[]
  isDefault?: boolean // true only for "Inbox" (default landing board)
  createdBy?: string // email of board creator
  visibility?: 'everyone' | 'invite-only' // default: 'everyone'
  access?: BoardAccess[] // only used when visibility === 'invite-only'
  createdAt: string
  updatedAt: string
}

export interface MoodBoardPayload {
  version: 1
  boards: Board[]
}

// ============================================================================
// Defaults & Helpers
// ============================================================================

export const DEFAULT_PAYLOAD: MoodBoardPayload = { version: 1, boards: [] }

const DEFAULT_BOARD_ID = 'board_saved_ideas'

export function ensureDefaultBoard(boards: Board[]): Board[] {
  if (boards.some((b) => b.isDefault)) return boards
  const ts = new Date().toISOString()
  return [
    {
      id: DEFAULT_BOARD_ID,
      name: 'Inbox',
      ideas: [],
      isDefault: true,
      createdAt: ts,
      updatedAt: ts,
    },
    ...boards,
  ]
}

export function findDefaultBoard(boards: Board[]): Board | undefined {
  return boards.find((b) => b.isDefault)
}

export function isDefaultBoard(board: Board): boolean {
  return board.isDefault === true
}

/**
 * Resolve what level of access a user has to a specific board.
 * Returns 'edit' | 'view' | null (null = invisible/no access).
 *
 * @param board        The board to check
 * @param userEmail    Current user's email
 * @param toolAccess   The user's tool-level access ('EDIT' | 'VIEW' | 'OWNER')
 */
export function resolveBoardAccess(
  board: Board,
  userEmail: string,
  toolAccess: string
): 'edit' | 'view' | null {
  // Default boards are always visible to everyone
  if (board.isDefault) {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // If board is not invite-only, follow tool-level access
  if (board.visibility !== 'invite-only') {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // Board creator always has edit (capped at tool level)
  if (board.createdBy === userEmail) {
    return toolAccess === 'VIEW' ? 'view' : 'edit'
  }

  // Check board-level ACL
  const match = board.access?.find((a) => a.email === userEmail)
  if (!match) return null // invisible

  // Cap at tool-level access
  if (toolAccess === 'VIEW') return 'view'
  return match.level
}

// ============================================================================
// Public (share link) shapes — allowlist of fields safe for external viewers.
// No internal IDs, no emails, no ACL data. Photos/notes/comments opt-in.
// ============================================================================

export interface PublicIdeaImage {
  id: string
  url: string
  thumbnailUrl?: string
}

export interface PublicIdeaReaction {
  userName: string
  reaction: ReactionType
}

export interface PublicMoodBoardComment {
  authorName: string
  text: string
  createdAt: string
  refIdeaId?: string
  refIdeaLabel?: string
}

export interface PublicIdea {
  id: string
  name: string
  notes?: string
  images: PublicIdeaImage[]
  heroImageId: string | null
  sourceUrl?: string
  sourceTitle?: string
  tags: string[]
  reactions?: PublicIdeaReaction[]
  createdAt: string
}

export interface PublicBoard {
  id: string
  name: string
  ideas: PublicIdea[]
  comments?: PublicMoodBoardComment[]
  createdAt: string
}

export interface PublicMoodBoardPayload {
  version: 1
  boards: PublicBoard[]
}

export interface MoodBoardSanitizeOpts {
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
  includeSourceUrl: boolean
}

/** Allowlist-map a full Board to a safe public shape. */
export function toPublicBoard(
  board: Board,
  opts: MoodBoardSanitizeOpts
): PublicBoard {
  const pub: PublicBoard = {
    id: board.id,
    name: board.name,
    ideas: board.ideas.map((idea) => toPublicIdea(idea, opts)),
    createdAt: board.createdAt,
  }

  if (opts.includeComments && board.comments && board.comments.length > 0) {
    pub.comments = board.comments.map((c) => ({
      authorName: c.authorName,
      text: c.text,
      createdAt: c.createdAt,
      refIdeaId: c.refIdeaId,
      refIdeaLabel: c.refIdeaLabel,
    }))
  }

  return pub
}

/** Allowlist-map a full Idea to a safe public shape. */
function toPublicIdea(idea: Idea, opts: MoodBoardSanitizeOpts): PublicIdea {
  const pub: PublicIdea = {
    id: idea.id,
    name: idea.name,
    images: opts.includePhotos
      ? idea.images.map((img) => ({ id: img.id, url: img.url, thumbnailUrl: img.thumbnailUrl }))
      : [],
    heroImageId: opts.includePhotos ? idea.heroImageId : null,
    tags: idea.tags,
    createdAt: idea.createdAt,
  }

  if (opts.includeNotes && idea.notes) {
    pub.notes = idea.notes
  }

  if (opts.includeSourceUrl && idea.sourceUrl) {
    pub.sourceUrl = idea.sourceUrl
    pub.sourceTitle = idea.sourceTitle || undefined
  }

  if (idea.reactions && idea.reactions.length > 0) {
    pub.reactions = idea.reactions.map((r) => ({
      userName: r.userName,
      reaction: r.reaction,
    }))
  }

  return pub
}

// ============================================================================

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function now(): string {
  return new Date().toISOString()
}
